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
