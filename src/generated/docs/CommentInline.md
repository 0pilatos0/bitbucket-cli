# CommentInline


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**from** | **number** | The comment\&#39;s anchor line in the old version of the file. If the comment is a multi-line comment, this is the ending line number in the old version of the file. | [optional] [default to undefined]
**to** | **number** | The comment\&#39;s anchor line in the new version of the file. If the comment is a multi-line comment, this is the ending line number in the new version of the file. | [optional] [default to undefined]
**start_from** | **number** | The starting line number in the old version of the file, if the comment is a multi-line comment. This is null otherwise. | [optional] [default to undefined]
**start_to** | **number** | The starting line number in the new version of the file, if the comment is a multi-line comment. This is null otherwise. | [optional] [default to undefined]
**path** | **string** | The path of the file this comment is anchored to. | [default to undefined]

## Example

```typescript
import { CommentInline } from './api';

const instance: CommentInline = {
    from,
    to,
    start_from,
    start_to,
    path,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
