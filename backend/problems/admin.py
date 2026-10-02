from django.contrib import admin

from .models import Problem, Tag, TestCase


class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "difficulty", "is_published", "created_at")
    list_filter = ("difficulty", "is_published", "tags")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("tags",)
    inlines = [TestCaseInline]


@admin.register(TestCase)
class TestCaseAdmin(admin.ModelAdmin):
    list_display = ("problem", "order", "is_hidden")
    list_filter = ("is_hidden",)