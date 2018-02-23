/* global FileReader*/
const Reader = function(file) {
    if (['[object File]', '[object Blob]', 'buffer'].indexOf(file.toString ()) < 0)
        throw new Error ('Invalid file.');

    const getBuffer = function() {
        return new Promise ( (res, rej) => {
            const fileReader = new FileReader ();

            fileReader.onload = e => res (e.target.result);
            fileReader.onerror = e => rej (e);
            fileReader.readAsArrayBuffer (file);
        } );
    };

    return {
        slice(a, b = file.size) {
            if (typeof a !== 'number' | typeof b !== 'number')
                throw new TypeError ('slice: Must be a number.');
            if (a > b) return null;
            return Reader (file.slice (a, b));
        },
        get length() {
            return file.size;
        },
        async getPositiveNumber(a, b) {
            if (typeof a !== 'number')
                throw new TypeError ('getPositiveNumber: Must be a number.');
            if (typeof b !== 'number') b = a + 1;
            if (a > b) return 0;
            let acc = 0;
            const slice = await (await this.slice (a, b)).toUint8Arr ();

            for (let i = 0; i < slice.length; i++) {
                acc += slice[i] * 0x100 ** (slice.length - i - 1);
            }
            return acc;
        },
        async toBlob() {
            return await file.slice ();
        },
        async toUint8Arr() {
            return new Uint8Array (await getBuffer ());
        },
        async toUint16Arr() {
            return new Uint16Array (await getBuffer ());
        },
        async toString(u16 = false) {
            if (u16) return String.fromCharCode.apply (null, await (this.toUint16Arr ()));
            return String.fromCharCode.apply (null, await (this.toUint8Arr ()));
        },
    };
};

module.exports = Reader;
