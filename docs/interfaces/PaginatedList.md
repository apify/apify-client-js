# Interface: PaginatedList<Data\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | extends `unknown` |

## Table of contents

### Properties

- [count](PaginatedList.md#count)
- [desc](PaginatedList.md#desc)
- [items](PaginatedList.md#items)
- [limit](PaginatedList.md#limit)
- [offset](PaginatedList.md#offset)
- [total](PaginatedList.md#total)

## Properties

### <a id="count" name="count"></a> count

• **count**: `number`

Count of dataset entries returned in this set.

___

### <a id="desc" name="desc"></a> desc

• **desc**: `boolean`

Should the results be in descending order.

___

### <a id="items" name="items"></a> items

• **items**: `Data`[]

Dataset entries based on chosen format parameter.

___

### <a id="limit" name="limit"></a> limit

• **limit**: `number`

Maximum number of dataset entries requested.

___

### <a id="offset" name="offset"></a> offset

• **offset**: `number`

Position of the first returned entry in the dataset.

___

### <a id="total" name="total"></a> total

• **total**: `number`

Total count of entries in the dataset.
