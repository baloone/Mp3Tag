const map = {
    TALB: 'album', TAL: 'album',
    PIC: 'picture', APIC: 'picture',
    TP1: 'artist', TPE1: 'artist',
    TIT2: 'title', TT2: 'title',
    TYER: 'year', TYE: 'year', TDRC: 'year',
    TRCK: 'track', TRK: 'track',
    TCON: 'genre', TCO: 'genre',
};

module.exports = function(header, frames) {
    const ret = {frames: {}};

    for (const frame of frames) {
        ret.frames[frame.id] = frame;
        const alias = map[frame.id];

        if (typeof alias !== 'undefined') ret[alias] = frame;
    }
    ret.header = header;
    return ret;
};
