const decodeMp3Tag = (function(){


    const fileToArrayBuffer = function (blob) {
        return new Promise ((res, rej) => {
            const reader = new FileReader();
            reader.onload = function() {
                res(reader.result);
            };
            reader.onabort = function() {
                rej(reader.error);
            };
            
            reader.readAsArrayBuffer(blob);
        });
    };
    
    const bufferToString = (buf, u16=false) => String.fromCodePoint(...new (u16?Uint16Array:Uint8Array)(buf));
    
    const superBuffer = buf => {
        return {
            get buf () {return buf;},
            splice (a, b) {
                const tmp = buf.slice (a,b);
                buf = buf.slice (b)
                return superBuffer (tmp)
            }
        };
    }
    
    
    
    const decodeMp3Tag = async function (file) {
        if (file.type !== "audio/mpeg" && file.type !== "") return null;
        const id3v2Head = superBuffer (await fileToArrayBuffer (file.slice(0, 10)));
        const concatSize = (buf, i=8) => [...new Uint8Array (buf)].reduce ((prev, cur) =>(prev << i) + cur, 0);
        const id3v1Genre = ["Blues","Classic Rock","Country","Dance","Disco","Funk","Grunge","Hip-Hop","Jazz","Metal","New Age","Oldies","Other","Pop","R&B","Rap","Reggae","Rock","Techno","Industrial","Alternative","Ska","Death Metal","Pranks","Soundtrack","Euro-Techno","Ambient","Trip-Hop","Vocal","Jazz+Funk","Fusion","Trance","Classical","Instrumental","Acid","House","Game","Sound Clip","Gospel","Noise","AlternRock","Bass","Soul","Punk","Space","Meditative","Instrumental Pop","Instrumental Rock","Ethnic","Gothic","Darkwave","Techno-Industrial","Electronic","Pop-Folk","Eurodance","Dream","Southern Rock","Comedy","Cult","Gangsta","Top 40","Christian Rap","Pop/Funk","Jungle","Native American","Cabaret","New Wave","Psychedelic","Rave","Showtunes","Trailer","Lo-Fi","Tribal","Acid Punk","Acid Jazz","Polka","Retro","Musical","Rock & Roll","Hard Rock"];
    
    
        if (bufferToString(id3v2Head.splice(0,3).buf) !== "ID3") {
            const id3v1Tag = superBuffer (await fileToArrayBuffer (file.slice(-128)));
            
            if (bufferToString(id3v1Tag.splice(0,3).buf) !== "TAG") return null;
            return {
                id3Version: 1,
                title: bufferToString (id3v1Tag.splice(0, 30).buf),
                artist: bufferToString (id3v1Tag.splice(0, 30).buf),
                year: bufferToString (id3v1Tag.splice(0, 4).buf),
                comment: bufferToString (id3v1Tag.splice(0, 30).buf),
                genre: id3v1Genre[(new Uint8Array (id3v1Tag.splice(0, 1).buf))[0]],
            }
        }
    
        const id3v2Version = [...new Uint8Array (id3v2Head.splice(0,2).buf)].join('.');
        if (id3v2Version[0]-0 < 3) throw new Error('id3v2 2 not implemented yet');
        const [flags] = new Uint8Array (id3v2Head.splice(0,1).buf);
        if (flags & 0b1111) return null;
        const unsynchronisation = (flags & 0b10000000) !== 0;
        const extendedHeader = (flags & 0b01000000) !== 0;
        const experimentalIndicator = (flags & 0b00100000) !== 0;
        const FooterPresent = (flags & 0b00010000) !== 0;
        const size = concatSize (id3v2Head.splice(0,4).buf);
        const tag = superBuffer (await fileToArrayBuffer (file.slice(10).slice(0, size)));
        
    
        if (extendedHeader) {
            const [size] = new Uint32Array (tag.splice(0, 4).buf);
            const extHeader = tag.splice(0, size); // TODO
        }
    
        const frames = {
            TXXX: [],
            WXXX: [],
            COMM: [],
            UFID: [],
            WCOM: [],
            WOAR: [],
            USLT: [],
            SYLT: [],
            RVA2: [],
            EQU2: [],
            GEOB: [],
            POPM: [],
            AENC: [],
            LINK: [],
            USER: [],
            COMR: [],
            SIGN: [],
        };
        const add = (i,v) => frames[i]==null?frames[i]=v:frames[i].push(v);
        const text = data => {
            const [enc] = new Uint8Array (data.splice(0,1).buf);
            return bufferToString (data.buf, enc%3)
        }
    
        while (1) {
            const UframeId = new Uint8Array (tag.splice(0, 4).buf);
            const frameId = String.fromCodePoint(...UframeId);
            if (!UframeId[0]) break;
            const size = concatSize (tag.splice(0,4).buf);
            const [flags] = new Uint16Array (tag.splice(0,2).buf);
            const data = tag.splice(0,size);
            console.log (frameId);
            if (frameId === "UFID") {
                const arr = new Uint8Array (data.buf);
                const i = arr.indexOf (0);
                if ( i < 0 ) throw rej ('UFID');
                add (frameId, {
                    ownerIdentifier: String.fromCharPoint(...arr.slice(0,i)),
                    identifier: arr.slice (i+1)
                });
            }
            else if (frameId[0] === "T") {
                if (frameId === "TXXX") { 
                    const [description, value] = text (data).split ("\u0000").filter (e => e!=="");
                    add (frameId, {description, value});
                } else add (frameId,text (data));
            }
            else if (frameId[0] === "W") {
                if (frameId === "WXXX") {
                    const [description, url] = text (data).split ("\u0000").filter (e => e!=="");
                    add (frameId, {description, url});
                } else add (frameId, bufferToString (data.buf));
            }
            else if (frameId  === "APIC") {
                const [enc] = new Uint8Array (data.splice(0,1).buf);
                const arr = new Uint8Array (data.buf);
                let off = 0;
                for (; arr[off] !== 0 && off < arr.length; off++);
                const type = bufferToString (data.splice (0, off).buf, enc%3);
                let prevoff = off++;off++;
                for (; arr[off] !== 0 && off < arr.length; off++);
                for (; arr[off] === 0 && off < arr.length; off++); 
                data.splice (0, off-prevoff);
                add (frameId, new Blob ([data.buf], {type}));
            }
            else if (frameId === "COMM") {
                const [enc] = new Uint8Array (data.splice(0,1).buf);
                const language = bufferToString (data.splice(0,3).buf);
                const arr = new Uint8Array (data.buf);
                const [i, j] = [arr.indexOf(0), arr.length-1 - [...arr].reverse().indexOf(0)]
                const shortDescription = bufferToString (data.buf.slice(0,i), enc%3);
                const comment = bufferToString (data.buf.slice(j+1), enc%3);
                add (frameId, {
                    language, shortDescription, comment
                })
            }
            else add (frameId, new Uint8Array (data.buf));
           
        }
    
        const ret = {
            frames
        }
        if (ret.frames["TIT2"]!=null) ret.title = ret.frames["TIT2"];
        if (ret.frames["TPE1"]!=null) ret.artist = ret.frames["TPE1"];
        if (ret.frames["TYER"]!=null) ret.year = ret.frames["TYER"];
        if (ret.frames["TALB"]!=null) ret.album = ret.frames["TALB"];
        if (ret.frames["TCON"]!=null) ret.genre = ret.frames["TCON"];
        if (ret.frames["TRCK"]!=null) ret.genre = ret.frames["TRCK"];
        if (ret.frames["COMM"]!=null) ret.comments = ret.frames["COMM"].map(e=>e.comment);
        if (ret.frames["APIC"]!=null) ret.picture = ret.frames["APIC"];
    
        return ret;
    }
    
    return decodeMp3Tag;

})();