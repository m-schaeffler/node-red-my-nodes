# @mschaeffler/node-red-fsatomic

Node-Red nodes for atomic file operations.

If the msg property `invalid` is present in the message, all nodes ignore the message.

## Install

```
$ npm install @mschaeffler/node-red-fsatomic
```

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fsatomic/examples/fsatomic.png)

## fileWriteAtomic

With this node data can be written into a file in an atomic manner, so that there is either the old file ort the new file, but never no file.

### Input

.

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|filename|string| file name; if set to `""`, the file name is set by the input message (`msg.filename`).|
|encoding|string| encoding, (only the encodings integrated into nodejs are possible)[a href="https://nodejs.org/api/buffer.html#buffers-and-character-encodings]. If set to `msg.encoding`, the encoding is taken from the input message.|
|append new line|boolean| append an end of line to the payload.|
|create dir|boolean| create the directory, if it does not exist.|
|pretty json|boolean| in case of `msg.payload` beeing an Object, the JSON is formated in a human readable manner.|
|Status|boolean|shows the actual value as a node status.|

## fileReadSimple

With this node data can be read from a file in way similar to the `fileWriteAtomic` node.

### Input

.

### Output

.

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Status|boolean|shows the actual value as a node status.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fsatomic/examples/fsatomic.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
