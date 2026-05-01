from django.core.management.base import BaseCommand
from organizations.models import Organization

class Command(BaseCommand):
    help = 'Update GPS coordinates for all companies.'

    def add_arguments(self, parser):
        parser.add_argument('latitude', type=float, help='Target Latitude')
        parser.add_argument('longitude', type=float, help='Target Longitude')

    def handle(self, *args, **options):
        lat = options['latitude']
        lon = options['longitude']
        
        count = Organization.objects.update(latitude=lat, longitude=lon)
        self.stdout.write(self.style.SUCCESS(f'Updated {count} organizations to GPS: {lat}, {lon}'))
