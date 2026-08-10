# Tag


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**name** | **string** | The name of the ref. | [optional] [default to undefined]
**target** | [**Commit**](Commit.md) |  | [optional] [default to undefined]
**message** | **string** | The message associated with the tag, if available. | [optional] [default to undefined]
**date** | **string** | The date that the tag was created, if available | [optional] [default to undefined]
**tagger** | [**Author**](Author.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Tag } from './api';

const instance: Tag = {
    type,
    links,
    name,
    target,
    message,
    date,
    tagger,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
