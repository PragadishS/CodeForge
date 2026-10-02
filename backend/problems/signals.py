from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from .cache import invalidate_problem_list
from .models import Problem, Tag


@receiver(post_save, sender=Problem)
@receiver(post_delete, sender=Problem)
@receiver(post_save, sender=Tag)
@receiver(post_delete, sender=Tag)
def bust_problem_list_cache(**kwargs):
    invalidate_problem_list()


@receiver(m2m_changed, sender=Problem.tags.through)
def bust_problem_tags_cache(**kwargs):
    invalidate_problem_list()