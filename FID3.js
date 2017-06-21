(function () {
  var dels = ['AENC', 'APIC', 'COMM', 'COMR', 'ENCR', 'EQUA', 'ETCO', 'GEOB', 'GRID','IPLS', 'LINK', 'MCDI', 'MLLT', 'OWNE', 'PRIV', 'PCNT', 'POPM', 'POSS','RBUF', 'RVAD', 'RVRB', 'SYLT', 'SYTC', 'TALB', 'TBPM', 'TCOM', 'TCON','TCOP', 'TDAT', 'TDLY', 'TENC', 'TEXT', 'TFLT', 'TIME', 'TIT1', 'TIT2','TIT3', 'TKEY', 'TLAN', 'TLEN', 'TMED', 'TOAL', 'TOFN', 'TOLY', 'TOPE','TORY', 'TOWN', 'TPE1', 'TPE2', 'TPE3', 'TPE4', 'TPOS', 'TPUB', 'TRCK','TRDA', 'TRSN', 'TRSO', 'TSIZ', 'TSRC', 'TSSE', 'TYER', 'TXXX', 'UFID','USER', 'USLT', 'WCOM', 'WCOP', 'WOAF', 'WOAR', 'WOAS', 'WORS', 'WPAY','WPUB', 'WXXX', 'CNT', 'BUF', 'COM', 'CRA', 'CRM', 'ETC', 'EQU', 'GEO','IPL', 'LNK', 'MCI', 'MLL', 'PIC', 'POP', 'REV', 'RVA', 'SLT', 'STC', 'TAL','TBP', 'TCM', 'TCO', 'TCR', 'TDA', 'TDY', 'TEN', 'TFT', 'TIM', 'TKE', 'TLA','TLE', 'TMT', 'TOA', 'TOF', 'TOL', 'TOR', 'TOT', 'TP1', 'TP2', 'TP3', 'TP4','TPA', 'TPB', 'TRC', 'TRD', 'TRK', 'TSI', 'TSS', 'TT1', 'TT2', 'TT3', 'TXT','TXX', 'TYE', 'UFI', 'ULT', 'WAF', 'WAR', 'WAS', 'WCM', 'WCP', 'WPB', 'WXX']
  var readTagAt = function (offset, file, callback) {
    var time = Date.now();
    var fileReader = new FileReader();
    fileReader.onload = function(e) {
      var buffer = e.target.result
      var ui8a = new Uint8Array(buffer)
      var tag4 = String.fromCharCode.apply(null, ui8a.slice(0, 4))
      var tag3 = tag4.slice(0, -1)
      var sizeA, size
      if (dels.indexOf(tag4) > -1) {
      sizeA = ui8a.slice(4, 8)
      size = new Uint32Array(sizeA.reverse().buffer)[0]
      callback( { tag: tag4, size: size, position: offset + 10 } )
      } else if (dels.indexOf(tag3) > -1) {
        sizeA = ui8a.slice(3, 6)
        size = sizeA[0] * 0x10000 + sizeA[1] * 0x100 + sizeA[2]
        callback( { tag: tag3, size:size, position: offset + 6 } )
      } else callback( { nothing: 1 })
    }
    fileReader.readAsArrayBuffer(file.slice(offset, offset+10))
  };
  var processTag = {
    picture: function (file, tag, callback) {
      var pos = tag.position;
      var size = tag.size;
      var fileReader = new FileReader();
      fileReader.onload = function(e) {
        var buf = e.target.result
        var arr = new Uint8Array(buf)
        var off = 1
        for (; arr[off] !== 0; off++);
        var mime = String.fromCharCode.apply(null, arr.slice(1, off))
        if (arr[off] === 0) off++;
        for (; arr[off] !== 0; off++);
        for (; arr[off] === 0; off++);
        callback( {
          blob: new Blob([file.slice(pos + off, pos + size)], {type:mime}),
        } )
      }
      fileReader.readAsArrayBuffer(file.slice(pos, pos + 64));
    },
    txt: function (file, beg, siz, callback) {
      if (siz < 1) callback( { text: null } )
      var fileReader = new FileReader();
      fileReader.onload = function(e) {
        var buf = e.target.result
        var ui8a = new Uint8Array(buf);
        var encoding = ui8a[0];
        var str;
        if(encoding % 3 != 0) {
          str = new Uint16Array(buf.slice(1));
        } else {
          str = ui8a.slice(1);
        }
        callback({
          text: String.fromCharCode.apply(null, str).replace('\0', '')
        });
      }
      fileReader.readAsArrayBuffer(file.slice(beg, beg + siz))
    },
    album: function (file, tag, callback) {
      return this.txt(file, tag.position, tag.size, callback)
    },
    artist: function (file, tag, callback) {
      return this.txt(file, tag.position, tag.size, callback)
    },
    title: function (file, tag, callback) {
      return this.txt(file, tag.position, tag.size, callback)
    },
    year: function (file, tag, callback) {
      return this.txt(file, tag.position, tag.size, callback)
    },
    track: function (file, tag, callback) {
      return this.txt(file, tag.position, tag.size, callback)
    },
    genre: function (file, tag, callback) {
      this.txt(file, tag.position, tag.size, function(res){
          var txt = res.text
          var match = txt.match(/\(([0-9]+)\)/)
          var intToGenre = ['Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop', 'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial', 'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance', 'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise', 'AlternRock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop', 'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial', 'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta', 'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave', 'Psychedelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock']
          if (match) {
            callback( { text: intToGenre[match[1] - 0] } )
          } else {
            callback( { text: txt } )
          }
        })
    }
  }
  var getMeta = function (file, callback, fail) {
    if (fail == null) fail = console.error
    var fileReader = new FileReader()
    fileReader.onload = function(e) {
      var buf = e.target.result
      var ui8a = new Uint8Array(buf)
    }
    fileReader.readAsArrayBuffer(file.slice(0,10))
    var cl = function (off, a) {
      if (a == null) a = []
      readTagAt(off, file, function(tag){
        if (!tag.nothing) {
          a.push(tag)
          cl(tag.position + tag.size, a)
        } else {
          callback(a)
        }
      })
    }
    cl(10)
  }

  var getId3 = function (file, opts, callback) {
    if (opts === null || opts === undefined) opts = {}
    var types = ['album','artist','picture','title','year','track','genre']
    var options = {
      album: !!opts.album,
      artist: !!opts.artist,
      picture: !!opts.picture,
      title: !!opts.title,
      year: !!opts.year,
      track: !!opts.track,
      genre: !!opts.genre
    }
    var map = {
      TALB: 'album',TAL: 'album',
      PIC: 'picture', APIC: 'picture',
      TP1: 'artist', TPE1: 'artist',
      TIT2: 'title', TT2: 'title',
      TYER: 'year', TYE: 'year', TDRC: 'year',
      TRCK: 'track', TRK: 'track',
      TCON: 'genre', TCO: 'genre'
    }
    getMeta(file, function (res){
      var obj = {}
      var filteredRes = res.filter(function(v){
        var tagName = map[v.tag];
        return !!tagName && options[tagName]
      })
      filteredRes.forEach(function(el,i) {
        var tagName = map[el.tag];
        obj[tagName] = null
        processTag[tagName](file, el, function (x) {
          obj[tagName] = x
          if(i === filteredRes.length - 1) callback(obj)
        })
      });
    })
  }
  var FID3 = function (file, options) {
    this.file = file
    this.options = options
    return this
  }
  FID3.prototype = {
    readSync: function () { console.info('FID3.readSync not implemented yet') },
    read: function (callback) {
      getId3(this.file, this.options, callback)
    }
  }
  window.FID3 = FID3
})()
