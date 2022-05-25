# Interface: RunWaitForFinishOptions

[index](../modules/index.md).RunWaitForFinishOptions

## Table of contents

### Properties

- [waitSecs](index.RunWaitForFinishOptions.md#waitsecs)

## Properties

### <a id="waitsecs" name="waitsecs"></a> waitSecs

• `Optional` **waitSecs**: `number`

Maximum time to wait for the run to finish, in seconds.
If the limit is reached, the returned promise is resolved to a run object that will have
status `READY` or `RUNNING`. If `waitSecs` omitted, the function waits indefinitely.
