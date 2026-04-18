# BaseCommit


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**hash** | **string** |  | [optional] [default to undefined]
**date** | **string** |  | [optional] [default to undefined]
**author** | [**Author**](Author.md) |  | [optional] [default to undefined]
**committer** | [**Committer**](Committer.md) |  | [optional] [default to undefined]
**message** | **string** |  | [optional] [default to undefined]
**summary** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]
**parents** | [**Array&lt;BaseCommit&gt;**](BaseCommit.md) |  | [optional] [default to undefined]

## Example

```typescript
import { BaseCommit } from './api';

const instance: BaseCommit = {
    hash,
    date,
    author,
    committer,
    message,
    summary,
    parents,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
