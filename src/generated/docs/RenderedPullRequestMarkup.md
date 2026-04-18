# RenderedPullRequestMarkup

User provided pull request text, interpreted in a markup language and rendered in HTML

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**title** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]
**description** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]
**reason** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RenderedPullRequestMarkup } from './api';

const instance: RenderedPullRequestMarkup = {
    title,
    description,
    reason,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
