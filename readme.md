# Fast Id3 tag reader
## Example:
![Screenshot](img/screenshot.png)
## Usage:
```js
var parser = new FID3(file|blob, {
                picture: true|false,
                album: true|false,
                artist: true|false,
                title: true|false,
                year: true|false,
                genre: true|false,
                track: true|false
            });
parser.read(result => console.log(result.title.text))
```
