# Interface: BuildClientWaitForFinishOptions

## Table of contents

### Properties

- [waitSecs](BuildClientWaitForFinishOptions.md#waitsecs)

## Properties

### <a id="waitsecs" name="waitsecs"></a> waitSecs

• `Optional` **waitSecs**: `number`

Maximum time to wait for the build to finish, in seconds.
If the limit is reached, the returned promise is resolved to a build object that will have
status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
