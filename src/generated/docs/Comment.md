# Comment


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**updated_on** | **string** |  | [optional] [default to undefined]
**content** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]
**user** | [**Account**](Account.md) |  | [optional] [default to undefined]
**deleted** | **boolean** |  | [optional] [default to undefined]
**parent** | [**Comment**](Comment.md) |  | [optional] [default to undefined]
**inline** | [**CommentInline**](CommentInline.md) |  | [optional] [default to undefined]
**links** | [**CommentLinks**](CommentLinks.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Comment } from './api';

const instance: Comment = {
    id,
    created_on,
    updated_on,
    content,
    user,
    deleted,
    parent,
    inline,
    links,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
