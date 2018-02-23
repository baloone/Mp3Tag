(function() {
    const FR = require ('./fReader.js');
    const Header = require ('./Header.js');
    const Tag = require ('./Tag.js');
    const Frame = require ('./Frame.js');
    const v2Ids = [ 'BUF', 'CNT', 'COM', 'CRA', 'CRM', 'ETC', 'EQU', 'GEO', 'IPL', 'LNK', 'MCI', 'MLL', 'PIC', 'POP', 'REV', 'RVA', 'SLT', 'STC', 'TAL', 'TBP', 'TCM', 'TCO', 'TCR', 'TDA', 'TDY', 'TEN', 'TFT', 'TIM', 'TKE', 'TLA', 'TLE', 'TMT', 'TOA', 'TOF', 'TOL', 'TOR', 'TOT', 'TP1', 'TP2', 'TP3', 'TP4', 'TPA', 'TPB', 'TRC', 'TRD', 'TRK', 'TSI', 'TSS', 'TT1', 'TT2', 'TT3', 'TXT', 'TXX', 'TYE', 'UFI', 'ULT', 'WAF', 'WAR', 'WAS', 'WCM', 'WCP', 'WPB', 'WXX' ];
    const v3Ids = [ 'AENC', 'APIC', 'ASPI', 'ASPI', 'COMM', 'COMR', 'ENCR', 'EQU2', 'EQU2', 'EQUA', 'ETCO', 'GEOB', 'GRID', 'IPLS', 'LINK', 'MCDI', 'MLLT', 'OWNE', 'PCNT', 'POPM', 'POSS', 'PRIV', 'RBUF', 'RVA2', 'RVA2', 'RVAD', 'RVRB', 'SEEK', 'SEEK', 'SIGN', 'SIGN', 'SYLT', 'SYTC', 'TALB', 'TBPM', 'TCOM', 'TCON', 'TCOP', 'TDAT', 'TDEN', 'TDEN', 'TDLY', 'TDOR', 'TDOR', 'TDRC', 'TDRC', 'TDRL', 'TDRL', 'TDTG', 'TDTG', 'TENC', 'TEXT', 'TFLT', 'TIME', 'TIPL', 'TIPL', 'TIT1', 'TIT2', 'TIT3', 'TKEY', 'TLAN', 'TLEN', 'TMCL', 'TMCL', 'TMED', 'TMOO', 'TMOO', 'TOAL', 'TOFN', 'TOLY', 'TOPE', 'TORY', 'TOWN', 'TPE1', 'TPE2', 'TPE3', 'TPE4', 'TPOS', 'TPRO', 'TPRO', 'TPUB', 'TRCK', 'TRDA', 'TRSN', 'TRSO', 'TSIZ', 'TSOA', 'TSOA', 'TSOP', 'TSOP', 'TSOT', 'TSOT', 'TSRC', 'TSSE', 'TSST', 'TSST', 'TXXX', 'TYER', 'UFID', 'USER', 'USLT', 'WCOM', 'WCOP', 'WOAF', 'WOAR', 'WOAS', 'WORS', 'WPAY', 'WPUB', 'WXXX' ];
    const FID3 = async function(file) {
        let fileReader = FR (file);
        const header = Header (
            await fileReader.slice (0, 3).toString (),
            await fileReader.getPositiveNumber (3, 4),
            await fileReader.getPositiveNumber (5),
            await fileReader.getPositiveNumber (7, 10),
        );
        const frames = [];

        fileReader = fileReader.slice (10);
        if (header.extended) throw new Error ('FID3: Extended header not implemented');
        if (header.version > 2) {
            let id = await fileReader.slice (0, 4).toString ();

            while (v3Ids.indexOf (id) > -1) {
                const size = await fileReader.getPositiveNumber (4, 8);
                const flags = await fileReader.getPositiveNumber (8, 10);
                
                frames.push (Frame (id, size, flags, fileReader.slice (10)));
                fileReader = fileReader.slice (10 + size);
                id = await fileReader.slice (0, 4).toString ();
            }
        } else {
            let id = await fileReader.slice (0, 3).toString ();

            while (v2Ids.indexOf (id) > -1) {
                const size = await fileReader.getPositiveNumber (3, 6);

                frames.push (Frame (id, size, 0, fileReader.slice (6)));
                fileReader = fileReader.slice (6 + size);
                id = await fileReader.slice (0, 3).toString ();
            }
        }
        return Tag (header, frames);
    };

    global.FID3 = FID3;
} ());

