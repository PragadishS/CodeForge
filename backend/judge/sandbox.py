import ast
import os
import resource
import shutil
import subprocess
import sys
import tempfile

BANNED_MODULES = {
    "os",
    "sys",
    "subprocess",
    "socket",
    "shutil",
    "ctypes",
    "importlib",
    "pickle",
    "pathlib",
}


def ast_violation(source: str) -> str | None:
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return f"syntax error: {exc}"

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                top = alias.name.split(".")[0]
                if top in BANNED_MODULES:
                    return f"banned import: {top}"
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                top = node.module.split(".")[0]
                if top in BANNED_MODULES:
                    return f"banned import: {top}"
        elif isinstance(node, ast.Call):
            func = node.func
            if isinstance(func, ast.Name) and func.id in {"eval", "exec", "compile", "__import__"}:
                return f"banned call: {func.id}"
    return None


def _apply_memory_limit(memory_limit_kb: int) -> None:
    cap = memory_limit_kb * 1024
    resource.setrlimit(resource.RLIMIT_AS, (cap, cap))


def run_python(source: str, stdin_data: str, time_limit_ms: int, memory_limit_kb: int) -> tuple[str, str, str]:
    """Returns (verdict, stdout, error). verdict is a Submission.Verdict value."""
    from judge.models import Submission

    timeout_s = max(time_limit_ms / 1000.0, 0.1)
    handle = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
    try:
        handle.write(source)
        handle.close()
        try:
            completed = subprocess.run(
                [sys.executable, handle.name],
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=timeout_s,
                preexec_fn=lambda: _apply_memory_limit(memory_limit_kb),
            )
        except subprocess.TimeoutExpired:
            return Submission.Verdict.TIME_LIMIT, "", "time limit exceeded"
        except MemoryError:
            return Submission.Verdict.MEMORY_LIMIT, "", "memory limit exceeded"
    finally:
        os.unlink(handle.name)

    stdout = completed.stdout or ""
    stderr = completed.stderr or ""
    if completed.returncode != 0:
        err = stderr.strip() or f"exit code {completed.returncode}"
        lowered = err.lower()
        if "memoryerror" in lowered or completed.returncode in {-9, 137}:
            return Submission.Verdict.MEMORY_LIMIT, stdout, err
        return Submission.Verdict.RUNTIME_ERROR, stdout, err
    return Submission.Verdict.ACCEPTED, stdout, ""


def compile_cpp(source: str) -> tuple[str, str | None, str]:
    """Returns (workdir, binary_path or None, error). Caller must cleanup_workdir(workdir)."""
    workdir = tempfile.mkdtemp(prefix="cf-cpp-")
    src = os.path.join(workdir, "main.cpp")
    binary = os.path.join(workdir, "main")
    with open(src, "w") as handle:
        handle.write(source)
    try:
        compiled = subprocess.run(
            ["g++", "-O2", "-std=c++17", src, "-o", binary],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except FileNotFoundError:
        return workdir, None, "g++ not installed on worker"
    except subprocess.TimeoutExpired:
        return workdir, None, "compile time exceeded"
    if compiled.returncode != 0:
        err = (compiled.stderr or compiled.stdout or "compile failed").strip()
        return workdir, None, err[:2000]
    return workdir, binary, ""


def run_binary(
    binary: str, stdin_data: str, time_limit_ms: int, memory_limit_kb: int
) -> tuple[str, str, str]:
    from judge.models import Submission

    timeout_s = max(time_limit_ms / 1000.0, 0.1)
    try:
        completed = subprocess.run(
            [binary],
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            preexec_fn=lambda: _apply_memory_limit(memory_limit_kb),
        )
    except subprocess.TimeoutExpired:
        return Submission.Verdict.TIME_LIMIT, "", "time limit exceeded"
    except MemoryError:
        return Submission.Verdict.MEMORY_LIMIT, "", "memory limit exceeded"

    stdout = completed.stdout or ""
    stderr = completed.stderr or ""
    if completed.returncode != 0:
        err = stderr.strip() or f"exit code {completed.returncode}"
        if completed.returncode in {-9, 137}:
            return Submission.Verdict.MEMORY_LIMIT, stdout, err
        return Submission.Verdict.RUNTIME_ERROR, stdout, err
    return Submission.Verdict.ACCEPTED, stdout, ""


def cleanup_workdir(workdir: str | None) -> None:
    if workdir:
        shutil.rmtree(workdir, ignore_errors=True)