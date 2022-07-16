// Copyright (C) 2019 Mohamed H
// 
// Mp3TagReader is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// Mp3TagReader is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
// 
// You should have received a copy of the GNU Lesser General Public License
// along with Mp3TagReader. If not, see <http://www.gnu.org/licenses/>.

const getMp3Tag = (function(){

    const strOfBuffer = (buf, base2 = false) => (base2?"0b_":"0x_")+[...new Uint8Array(buf)].map(e=>e.toString(16-14*base2).padStart(2+6*base2, '0')).join('_');

    const bitsofByte = function(x, scheme, map={}) {
        const ret = {};
        if (scheme.length !== 8) throw new Error("bitsofByte");
        for(let i = 0, y = 1 << 7; i < 8; i++, y >>= 1 ) {
            if (scheme[i] === "0" && x & y) throw new Error("bitsofByte"); 
            if (scheme[i] === "1" && !(x & y)) throw new Error("bitsofByte");
            if (["0", "1", "*"].includes(scheme[i])) continue;
            const index = map[scheme[i]] != null ? map[scheme[i]] : scheme[i];
            const bit = !!(x & y) * 1;
            ret[index] = ret[index] == null ? bit : ret[index] * 2 + bit;
        }
        return ret
    }

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
            },
            slice (a, b) {
                const tmp = buf.slice (a,b);
                return superBuffer (tmp)
            }
        };
    }
    
    
    
    const getMp3Tag = async function (file) {
        if (file.type !== "audio/mpeg" && file.type !== "") return null;
        const id3v2Head = superBuffer (await fileToArrayBuffer (file.slice(0, 10)));
        const concatSize = (buf, i=8) => [...new Uint8Array (buf)].reduce ((prev, cur) =>(prev << i) + cur);
        const id3v1Genre = ["Blues","Classic Rock","Country","Dance","Disco","Funk","Grunge","Hip-Hop","Jazz","Metal","New Age","Oldies","Other","Pop","R&B","Rap","Reggae","Rock","Techno","Industrial","Alternative","Ska","Death Metal","Pranks","Soundtrack","Euro-Techno","Ambient","Trip-Hop","Vocal","Jazz+Funk","Fusion","Trance","Classical","Instrumental","Acid","House","Game","Sound Clip","Gospel","Noise","AlternRock","Bass","Soul","Punk","Space","Meditative","Instrumental Pop","Instrumental Rock","Ethnic","Gothic","Darkwave","Techno-Industrial","Electronic","Pop-Folk","Eurodance","Dream","Southern Rock","Comedy","Cult","Gangsta","Top 40","Christian Rap","Pop/Funk","Jungle","Native American","Cabaret","New Wave","Psychedelic","Rave","Showtunes","Trailer","Lo-Fi","Tribal","Acid Punk","Acid Jazz","Polka","Retro","Musical","Rock & Roll","Hard Rock"];
    
    
        if (bufferToString(id3v2Head.splice(0,3).buf) !== "ID3") {
            const id3v1Tag = superBuffer (await fileToArrayBuffer (file.slice(-128)));
            
            if (bufferToString(id3v1Tag.splice(0,3).buf) !== "TAG") return null;
            return {
                id3: {
                    version: '1'
                },
                title: bufferToString (id3v1Tag.splice(0, 30).buf),
                artist: bufferToString (id3v1Tag.splice(0, 30).buf),
                year: bufferToString (id3v1Tag.splice(0, 4).buf),
                comment: bufferToString (id3v1Tag.splice(0, 30).buf),
                genre: id3v1Genre[(new Uint8Array (id3v1Tag.splice(0, 1).buf))[0]],
            }
        }
    
        const id3v2Version = [...new Uint8Array (id3v2Head.splice(0,2).buf)].join('.');
        const isv2_2 = id3v2Version[0]-0 < 3 ? 1 : 0;
        const [flags] = new Uint8Array (id3v2Head.splice(0,1).buf);
        if (flags & 0b1111) return null;
        const {
            unsynchronisation,
            extendedHeader_b,
            experimentalIndicator,
            footerPresent
        } = bitsofByte(flags, "abcd0000", {
            a: "unsynchronisation",
            b: "extendedHeader_b",
            c: "experimentalIndicator",
            d: "footerPresent"
        });

        const size = concatSize (id3v2Head.splice(0,4).buf);
        const tag = superBuffer (await fileToArrayBuffer (file.slice(10).slice(0, size)));
        const extendedHeader = extendedHeader_b ? {} : null;

    
        if (extendedHeader_b) {
            const a = tag.splice(0, 4).buf;
            if ((new Uint8Array(a)).some(x => x & 0b10000000))
                throw new Error("Error while getting the size of the extended header.");
            const size = concatSize(a, 7);
            const extHeader = tag.splice(0, size);
            const extendedFlags = new Uint8Array(extHeader.splice(0, 2).buf);
            if (id3v2Version[0] === "4") {
                if (extendedFlags[0] !== 0x00000001)
                    throw new Error("Error while reading the extended header.");
                const {b, c, d} = bitsofByte(extendedFlags[1], "0bcd0000");
                if (b) extHeader.splice(0, 1);
                if (c) extendedHeader.crcData = extHeader.splice(1, 6).buf;
                if (d) {
                    const {p, q, r, s, t} = bitsofByte(new Uint8Array(extHeader.splice(1, 2).buf)[0], "ppqrrstt");
                    const pverb = [
                        "No more than 128 frames and 1 MB total tag size.",
                        "No more than 64 frames and 128 KB total tag size.",
                        "No more than 32 frames and 40 KB total tag size.",
                        "No more than 32 frames and 4 KB total tag size."
                    ];
                    const qverb = [
                        "No restrictions",
                        "Strings are only encoded with ISO-8859-1 [ISO-8859-1] or UTF-8 [UTF-8]."
                    ];
                    const rverb = [
                        "No restrictions",
                        "No string is longer than 1024 characters.",
                        "No string is longer than 128 characters.",
                        "No string is longer than 30 characters."
                    ];
                    const sverb = [
                        "No restrictions",
                        "Images are encoded only with PNG [PNG] or JPEG [JFIF]."
                    ];
                    const tverb = [
                        "No restrictions",
                        "All images are 256x256 pixels or smaller.",
                        "All images are 64x64 pixels or smaller.",
                        "All images are exactly 64x64 pixels, unless required otherwise."
                    ];
                    extendedHeader.restrictions = {
                        tagSize: p,
                        textEncoding: q,
                        textFieldsSize: r,
                        imageEncoding: s,
                        imageSize: t,
                        verbose: {
                            tagSize: pverb[p],
                            textEncoding: qverb[q],
                            textFieldsSize: rverb[r],
                            imageEncoding: sverb[s],
                            imageSize: tverb[t],
                        }
                    };

                }
                extendedHeader.flags = {isAnUpdate: b, crc: c, restrictions: d};
            } else {
                const {x} = bitsofByte(extendedFlags[0], "x0000000");
                if (extendedFlags[1] !== 0)
                    throw new Error("Error while reading the extended header.");
                extendedHeader.flags = {crc: x};
                const size = concatSize(extHeader.splice(0, 4).buf);
                if (x) {
                    extendedHeader.crcData = extHeader.splice(0, 4).buf;
                }
            }

        }
    
        const frames = !isv2_2 ? {
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
        } : {
            COM: [],
            UFI: [],
            TXX: [],
            WXX: [],
            WAR: [],
            WCM: [],
            ULT: [],
            SLT: [],
            GEO: [],
            POP: [],
            CRM: [],
            CRA: [],
            LNK: [],
        };
        const add = (i,v) => !Array.isArray(frames[i])?frames[i]=v:frames[i].push(v);
        const text = data => {
            const [enc] = new Uint8Array (data.splice(0,1).buf);
            const t = bufferToString (data.buf, enc%3);
            return t.split(/[\u0000]+/).join(' ').trim()
        }

        while (1) {
            const UframeId = new Uint8Array (tag.splice(0, 4 - isv2_2).buf);
            const frameId = String.fromCodePoint(...UframeId);
            if (!UframeId[0]) break;
            const size = concatSize(tag.splice(0, 4 - isv2_2).buf, (7+ (id3v2Version[0]!=4)))
            const [flags] = new Uint16Array (tag.splice(0,2 - 2 * isv2_2).buf);
            const data = tag.splice(0,size);
            if (frameId === "UFID" || frameId === "UFI") {
                const arr = new Uint8Array (data.buf);
                const i = arr.indexOf (0);
                if ( i < 0 ) throw rej ('UFID');
                add (frameId, {
                    ownerIdentifier: String.fromCodePoint(...arr.slice(0,i)),
                    identifier: arr.slice (i+1)
                });
            }
            else if (frameId[0] === "T") {
                if (frameId === "TXXX" || frameId === "TXX") { 
                    const [description, value] = text (data).split ("\u0000").filter (e => e!=="");
                    add (frameId, {description, value});
                } else add (frameId,text (data));
            }
            else if (frameId[0] === "W") {
                if (frameId === "WXXX" || frameId === "WXX") {
                    const [description, url] = text (data).split ("\u0000").filter (e => e!=="");
                    add (frameId, {description, url});
                } else add (frameId, bufferToString (data.buf));
            }
            else if (frameId  === "APIC" || frameId  === "PIC") {
                const [enc] = new Uint8Array (data.splice(0,1).buf);
                const arr = new Uint8Array (data.buf);
                let off = 0;
                let prevoff = 0;
                let type = "";
                if (!isv2_2) {
                    for (; arr[off] !== 0 && off < arr.length; off++);
                    type = bufferToString (data.slice (0, isv2_2 ? ++off : off).buf, enc%3);
                    prevoff = off++;off++;

                } else {
                    const imgType = bufferToString(data.slice (off, off+3).buf);
                    type = "image/"+imgType.toLowerCase();
                    prevoff = off = 3;
                }
                for (; arr[off] !== 0 && off < arr.length; off++);
                for (; arr[off] === 0 && off < arr.length; off++);
                data.splice (0, off);
                add (frameId, new Blob ([data.buf], {type}));
            }
            else if (frameId === "COMM" || frameId === "COM") {
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
            frames,
            id3: {
                version: id3v2Version,
                unsynchronisation,
                extendedHeader,
                experimentalIndicator,
                footerPresent
            }
        }
        if (ret.frames["TIT2"]!=null) ret.title = ret.frames["TIT2"];
        if (ret.frames["TPE1"]!=null) ret.artist = ret.frames["TPE1"];
        if (ret.frames["TYER"]!=null) ret.year = ret.frames["TYER"];
        if (ret.frames["TALB"]!=null) ret.album = ret.frames["TALB"];
        if (ret.frames["TCON"]!=null) ret.genre = ret.frames["TCON"];
        if (ret.frames["TRCK"]!=null) ret.track = ret.frames["TRCK"];
        if (ret.frames["COMM"]!=null) ret.comments = ret.frames["COMM"].map(e=>e.comment);
        if (ret.frames["APIC"]!=null) ret.picture = ret.frames["APIC"];

        if (ret.frames["TT2"]!=null) ret.title = ret.frames["TT2"];
        if (ret.frames["TP1"]!=null) ret.artist = ret.frames["TP1"];
        if (ret.frames["TYE"]!=null) ret.year = ret.frames["TYE"];
        if (ret.frames["TAL"]!=null) ret.album = ret.frames["TAL"];
        if (ret.frames["TCO"]!=null) ret.genre = ret.frames["TCO"];
        if (ret.frames["TRK"]!=null) ret.track = ret.frames["TRK"];
        if (ret.frames["COM"]!=null) ret.comments = ret.frames["COM"].map(e=>e.comment);
        if (ret.frames["PIC"]!=null) ret.picture = ret.frames["PIC"];
    
        return ret;
    }
    
    return getMp3Tag;

})();

