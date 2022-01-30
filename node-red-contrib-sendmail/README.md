# sendmail

A simple node that sends an email via the local `/usr/bin/mail` command.

## Install

```
$ npm install node-red-contrib-sendmail
```

## Usage

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | string | the body of the email.            |
|topic   | string | the subject of the email.         |
|from    | string | sender address for the email.     |
|to      | string | destination address for the email.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|from  | string | sender address for the email.     |
|to    | string | destination address for the email.|

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
