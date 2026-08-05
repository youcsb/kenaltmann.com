# Ken Altmann Photography

A static portfolio site. No build step, no framework, no database — plain HTML,
one stylesheet, one script. Open `index.html` in a browser and it works.

## Adding, removing, or reordering photographs

Photographs live in `images/`, one folder per collection:

```
images/
  new-and-fresh/
  urbanscapes/
  landscapes/
  seascapes/
  travel/
  people/
  animals/
```

Each file is named like this:

```
04 - Horseshoe Bend.jpg
│    │
│    └── the caption shown under the photograph
└─────── position on the page (lowest number first)
```

**To add a photograph:** drop the file into the right folder, name it with a
number and a title, then run:

```bash
python3 tools/index-photos.py
```

That rewrites `assets/photos.js`, which is the only place the site reads photo
data from. Reload the page and the new photograph is there.

**To rename a caption:** rename the file and rerun the script.

**To reorder:** change the number prefixes and rerun the script.

**To remove a photograph:** delete the file and rerun the script.

Nothing else needs editing. The counts on the home page, the collection pages,
the menu, and the lightbox all read from the same generated file.

### Photo sizing

Long edge of 1800px, JPEG quality ~76, is what the current set uses — sharp on
a retina display without making pages heavy. To match that for a new photo:

```bash
sips -Z 1800 -s format jpeg -s formatOptions 76 "images/landscapes/19 - New Photo.jpg" --out "images/landscapes/19 - New Photo.jpg"
```

## Adding a whole new collection

1. Make the folder: `images/<slug>/`
2. Add a line to `COLLECTIONS` near the top of `tools/index-photos.py` with the
   slug, the display name, and the one-line description.
3. Copy any gallery page (say `landscapes.html`) to `<slug>.html` and change the
   three places the old slug appears: `<body data-page="…">`, `data-gallery="…"`,
   and the `<title>`/`<h1>`.
4. Run `python3 tools/index-photos.py`.

The navigation, the mobile menu, the home page collection list, and the "next
collection" link at the foot of each gallery all build themselves from that
list — there is no nav markup to keep in sync.

## Files

```
index.html            home — hero, statement, collection list, selected work
<collection>.html     seven gallery pages, all identical apart from the slug
about.html            Ken's bio, in his own words
contact.html          email and details
assets/site.css       all styling
assets/site.js        navigation, gallery layout, lightbox
assets/photos.js      generated — do not edit by hand
tools/index-photos.py the generator
images/               the photographs
```

## How the galleries lay themselves out

Photographs are grouped into rows until their aspect ratios add up to about
2.75. Within a row, each photograph's `flex-grow` is set to its own aspect
ratio, which makes the widths proportional to the shapes and lands every image
in the row on exactly the same height. Panoramas and every seventh frame are
hung on their own with wider margins. Below 780px everything stacks to one
column.

The upshot: photographs are never cropped and never distorted, and the wall
recomposes itself when you add or remove one.

## Editing the words

The collection descriptions are in `tools/index-photos.py` (the third item on
each `COLLECTIONS` line). Everything else is plain text in the HTML files.

## Running it locally

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321>. Opening `index.html` directly from Finder
also works.
