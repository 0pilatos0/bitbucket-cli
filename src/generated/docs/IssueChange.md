# IssueChange

An issue change.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**links** | **object** |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**user** | [**Account**](Account.md) |  | [optional] [default to undefined]
**issue** | [**Issue**](Issue.md) |  | [optional] [default to undefined]
**changes** | **object** |  | [optional] [default to undefined]
**message** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]

## Example

```typescript
import { IssueChange } from './api';

const instance: IssueChange = {
    type,
    links,
    name,
    created_on,
    user,
    issue,
    changes,
    message,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
