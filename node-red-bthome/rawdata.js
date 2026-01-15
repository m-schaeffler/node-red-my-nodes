class Rawdata {
    constructor(input)
    {
        this._data = input;
    }
    _utoi(num,bits)
    {
        const mask = 1 << ( bits - 1 );
        return num & mask ? num - ( 1 << bits ) : num;
    }
    length()
    {
        return this._data.length;
    }
    reset()
    {
        this._data = [];
    }
    getUInt8()
    {
        return this._data.shift();
    }
    getInt8()
    {
        return this._utoi( this.getUInt8(), 8 );
    }
    getUInt16()
    {
        const a = this._data.shift();
        const b = this._data.shift();
        return 0xffff & ( ( b << 8 ) | a );
    }
    getInt16()
    {
        return this._utoi( this.getUInt16(), 16 );
    }
    getUInt24()
    {
        const a = this._data.shift();
        const b = this._data.shift();
        const c = this._data.shift();
        return 0xffffff & ( ( c << 16 ) | ( b << 8 ) | a );
    }
    getInt24()
    {
        return this._utoi( this.getUInt24(), 24 );
    }
    getUInt32()
    {
        const a = this._data.shift();
        const b = this._data.shift();
        const c = this._data.shift();
        const d = this._data.shift();
        return 0xffffffff & ( ( d << 24 ) | ( c << 16 ) | ( b << 8 ) | a );
    }
    getInt32()
    {
        return this._utoi( this.getUInt32(), 32 );
    }
    getEnum(values)
    {
        return values[this.getUInt8()] ?? "";
    }
    getBuffer()
    {
        const size = this.getUInt8();
        let   buf  = Buffer.alloc( size );
        for( let i = 0; i < size; i++ )
        {
            buf[i] = this.getUInt8();
        }
        return buf;
    }
}

module.exports = Rawdata;
