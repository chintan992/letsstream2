# Streaming Plugin

We are developing the plugin system for the LetsStream WebApp. The plugin system will allow users to add third-party streaming services to the app. The plugin system will be built using the Stremio app plugin format.
Plugin can be data can be stored in the firestore database which we are already using for the user preferences and settings with authentication. The plugin management system will be responsible for fetching the plugin details and streaming links from the plugin url and storing it in the database. The plugin management system will also be responsible for updating the plugin details and streaming links when the plugin url is updated.

We are going to use the same api format as the Stremio app plugins. The plugin url will be in the format of https://yourdomain.com/manifest.json and it will return the plugin details and streaming links for movies, anime, and TV shows. The plugin details will include the plugin name, type, and a list of providers. 

You can check out the documentation further benith for the streaming link API which will be used to fetch the streaming links for movies, anime, and TV shows. The streaming link API will be used by the plugin management system to fetch the streaming links from the plugin url and store it in the database. The streaming link API will also be used by the app to fetch the streaming links when user clicks on the movie, anime, or TV show details page.


## Streaming link API

The streaming link API allows you to create and manage streaming links for movies, anime, and TV shows. You can use this API to generate secure, time-limited URLs for streaming movie,anime, and Tv shows.

We are current using TMDB api to fetch the movie, anime, and TV show details. We are going to use the tmdb id and imdb id to fetch the streaming links. It's going to use the same api format as the Stremio app plugins.

> Providers are going to be stored as a plugin in the database. Each plugin will have a name, type, and a list of providers.

Plugin Base URL: https://yourdomain.com/manifest.json

Example: https://streamflix-worker.chintanr21.workers.dev/manifest.json

Response:
```json
{
"id": "org.streamflix.addon",
"version": "1.0.0",
"name": "StreamFlix",
"description": "StreamFlix video links (accepts IMDB IDs and TMDB IDs, enriched with TMDB)",
"resources": [
"meta",
"stream"
],
"types": [
"movie",
"series"
],
"idPrefixes": [
"tt"
]
}
```

### Movie URL Pattern

Stream URL: https://yourdomain.com/stream/movie/{tmdb_id}.json

Example TMDB: https://streamflix-worker.chintanr21.workers.dev/stream/movie/550.json

Response:


```json
{
"streams": [
{
"url": "https://s3.ap-southeast-1.wasabisys.com/streamflix/movies/1999/fightclub.mkv",
"name": "Premium - 720p"
},
{
"url": "https://s3.ap-southeast-1.wasabisys.com/streamflix/movies/1999/fightclub.mkv",
"name": "Premium - 720p"
},
{
"url": "https://bb.streamflixserver.site/file/streamflix/movies/1999/fightclub.mkv",
"name": "Movies - 480p"
},
{
"url": "https://bb.streamflixserver.site/file/streamflix-sv-2/movies/1999/fightclub.mkv",
"name": "Movies - 480p"
},
{
"url": "https://cf.streamflixserver.site/movies/1999/fightclub.mkv",
"name": "Standard - 1080p"
},
{
"url": "https://cf.streamflixserver.site/movies/1999/fightclub.mkv",
"name": "Standard - 1080p"
},
{
"url": "https://cf.streamflixserver.site/movies/1999/fightclub.mkv",
"name": "Standard - 1080p"
}
]
}
```

## Tv Show URL Pattern

Stream URL: https://yourdomain.com/stream/series/{tmdb_id}%3A{season}%3A{episode}.json

Example TMDB: https://streamflix-worker.chintanr21.workers.dev/stream/series/1396%3A1%3A1.json

Response:

```json
{
"streams": [
{
"url": "https://s3.ap-southeast-1.wasabisys.com/streamflix/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "Premium - 720p"
},
{
"url": "https://s3.ap-southeast-1.wasabisys.com/streamflix/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "Premium - 720p"
},
{
"url": "https://bb.streamflixserver.site/file/streamflix/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "TV - 480p"
},
{
"url": "https://bb.streamflixserver.site/file/streamflix-sv-2/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "TV - 480p"
},
{
"url": "https://cf.streamflixserver.site/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "Standard - 1080p"
},
{
"url": "https://cf.streamflixserver.site/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "Standard - 1080p"
},
{
"url": "https://cf.streamflixserver.site/tv/breakingbad/s1/BrBa.S01E01.720p.BrRip.x264.400MB-Pahe.in.mkv",
"name": "Standard - 1080p"
}
]
}

```

## Video Player Integration

Plugin is going to return multiple types of streaming links, for example .m3u, .mp4, .mkv, .avi, etc. so it should be able to handle all of them flawlessly. 

We are going to use the [Video.js](https://videojs.com/) player for this plugin. Video.js is a free and open-source HTML5 video player that supports a wide range of video formats and streaming protocols. It also has a large community of developers who contribute to the project and provide support.

You have to make sure that the player is able to handle all the streaming links that the plugin returns.

There is a video player design format you have to follow:

- Progress bar with the current time(on left side of progress bar) and total duration(on right side of progress bar) of the video.
- Play/Pause button on the middle of the player as well as on the left side bottom corner under the progress bar.
- Volume control slider with mute button next to the play/pause button on the left side bottom corner under the progress bar.
- Fullscreen button on the right side bottom corner under the progress bar.
- Settings button (audio track, subtitles, quality, etc.) on the right side bottom corner under the progress bar before the fullscreen button.
- Subtitles button (to change the subtitles of the video) inside settings menu.
- Skip forward and backward buttons (10 seconds each) on the right and left side of the play/pause button on the middle of the player.
- Playback speed control (to change the speed of the video) inside settings menu
- Picture-in-Picture mode button on the right side bottom corner under the progress bar before the settings button.
- Theater mode button on the right side bottom corner under the progress bar before the picture-in-picture button.
- Auto-play next video option inside settings menu with the following options:
- Auto-play next episode option inside settings menu.
- Auto-play next season option inside settings menu.



I am listing some of the plugins base url for your reference so make sure you test the endpoints manually before integrating it with the app. 

Note: you have to test all the endpoints manually before integrating it with the app. So, you can see every plugin is providing the streaming urls in same json format but the streaming urls are different for each plugin. So, you have to make sure that the player is able to handle all the streaming links that the plugin returns. As, some of the links will be .m3u8, .mp4, .mkv, .avi, etc. so it should be able to handle all of them flawlessly.

https://vidlink-worker.chintanr21.workers.dev/manifest.json
https://videasy-worker.chintanr21.workers.dev/manifest.json
https://watch32-worker.chintanr21.workers.dev/manifest.json
https://yflix-worker.chintanr21.workers.dev/manifest.json
https://streamflix-worker.chintanr21.workers.dev/manifest.json
https://cinestream-worker.chintanr21.workers.dev/manifest.json
https://vidfast-stremio-addon.zmoualhi.workers.dev/manifest.json
https://animestream-addon.keypop3750.workers.dev/tp=q_4k,q_1080,a_dual,n_3/manifest.json


## Current Status

Currently, the mediadetails page is fully functional. There is a "Play" button on media details page for movies, while for tv show there is a button "Start from Beginning" and "Continue Watching" if they have watched it before.
There are also episode list on the tv show details page and each episode media card have the dedicated "Play" it show navigate to the player page for the respective episode of respective season. 

## Proposed Design for the Player Page

### Desktop Design
- Video Player: The video player will be the main component of the player page.
- On right side of video player there should be the list of episodes with season navigation for the tv shows content. For movies there will be no episode list and season navigation.
- There will also be a navigation buttons for next episode and previous episodes underneath the video player.
- There should be a lights out button to toggle focus mode and dim all other content from the page and just videplayer is focused. 

## Mobile Design
- Video Player: The video player will be the main component of the player page.
- There will be a navigation buttons for next episode and previous episodes underneath the video player.
- There should be a lights out button aside the navigation buttons to toggle focus mode and dim all other content from the page and just videplayer is focused. 
- On the bottom of the navigation buttons there should be the list of episodes with season navigation for the tv shows content. For movies there will be no episode list and season navigation.



