This project is a wiki for visual infographics on scientific papers.

## Tech stack

Backend uses:
* Python 3.14
* uv as package manager
* fastAPI
* postgresql
* sqlalchemy
* docker

Frontend uses:
* VanillaJS, HTML+CSS
* ThreeJS

## Coding style
We want to keep the codebase to a minimum complexity, and avoid reinventing the wheel. Everything else is commentary.

## Main features

We keep a Three.js visual lesson for every paper.

Main screen:
You paste doi of a paper.

If there is already a lesson for it, it is brought up.
If not, you create one using Claude API.

## Data model

Large git repo - "lessons", contains JS source code for the visual lessons, organized in a hierarchical folder structure by doi

all other data is in the database