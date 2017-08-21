const reader = {
    async text (fileReader) {
        const encoding = await fileReader.getPositiveNumber (0);

        console.log(encoding)
        return await (await fileReader.slice (1, fileReader.length - (encoding%3 !== 0 ? 0 : 1))).toString (encoding%3 !== 0);
    },
    async url (fileReader) {
        return await fileReader.toString ();
    },
    async picture (fileReader) {
        const arr = await (await fileReader.slice (1, 64)).toUint8Arr ();
        let off = 0;

        for (; arr[off] !== 0; off++);
        const mime = String.fromCharCode.apply (null, arr.slice (0, off));

        if (arr[off] === 0) off++;
        for (; arr[off] !== 0; off++);
        for (; arr[off] === 0; off++);
        return (await fileReader.slice (off + 1)).toBlob ();
    },
};

module.exports = function(id, size, flags, fileReader) {
    let value = null;

    return {
        get id() {
            return id; 
        },
        get size() {
            return size;
        },
        get flags() {
            return flags; 
        },
        get value() {
            if (value === null)
                throw new Error ('You must read the frame before accessing its value.');
            return value;
        },
        async read() {
            const fr = await fileReader.slice (0, size);

            if (id[0] === 'T' && id !== 'TXXX') {
                value = await reader.text (fr);
                
                return true;
            } else if (id[0] === 'W') {
                value = await reader.url (fr);
                return true;
            } else if (id.indexOf ('PIC') > -1) {
                value = await reader.picture (fr);   
                return true;             
            }
            return false;
        },
    };
};


