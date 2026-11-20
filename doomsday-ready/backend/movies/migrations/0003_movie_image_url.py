from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('movies', '0002_movie_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='movie',
            name='image_url',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
