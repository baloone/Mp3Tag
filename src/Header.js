module.exports = function(fi, version, flags, size) {
    flags = [ flags / 2 ** 3, flags / 2 ** 2 % 2, flags / 2 % 2, flags % 2 ].map (Math.floor);
    const a = false;

    return {
        get isId3() {
            return fi === 'ID3';
        },
        get version() {
            return this.isId3 ? version : -1;
        },
        get flags() {
            return this.isId3 ? flags : [];
        },
        get unsync() {
            return this.isId3 ? flags[0] === 1 : false;
        },
        get extended() {
            return this.isId3 ? flags[1] === 1 : false;
        },
        get exp() {
            return this.isId3 ? flags[2] === 1 : false;
        },
        get foot() {
            return this.isId3 ? flags[3] === 1 : false;
        },
        get size() {
            return this.isId3 ? size : -1;
        },
    };
};
