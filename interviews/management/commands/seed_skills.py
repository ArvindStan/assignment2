import json
from pathlib import Path

from django.core.management.base import BaseCommand

from interviews.models import Skill


class Command(BaseCommand):
    help = "Load skills from skills_seed.json"

    def handle(self, *args, **options):
        seed_file = Path("skills_seed.json")

        with seed_file.open("r", encoding="utf-8") as file:
            data = json.load(file)

        created = 0

        for skill in data["skills"]:
            _, was_created = Skill.objects.update_or_create(
                skill_id=skill["id"],
                defaults={
                    "dimension": skill["dimension"],
                    "name": skill["name"],
                },
            )

            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Skills loaded successfully. Created: {created}"
            )
        )