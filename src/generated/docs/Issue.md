# Issue


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | [**IssueLinks**](IssueLinks.md) |  | [optional] [default to undefined]
**id** | **number** |  | [optional] [default to undefined]
**repository** | [**Repository**](Repository.md) |  | [optional] [default to undefined]
**title** | **string** |  | [optional] [default to undefined]
**reporter** | [**Account**](Account.md) |  | [optional] [default to undefined]
**assignee** | [**Account**](Account.md) |  | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**updated_on** | **string** |  | [optional] [default to undefined]
**edited_on** | **string** |  | [optional] [default to undefined]
**state** | **string** |  | [optional] [default to undefined]
**kind** | **string** |  | [optional] [default to undefined]
**priority** | **string** |  | [optional] [default to undefined]
**milestone** | [**Milestone**](Milestone.md) |  | [optional] [default to undefined]
**version** | [**Version**](Version.md) |  | [optional] [default to undefined]
**component** | [**Component**](Component.md) |  | [optional] [default to undefined]
**votes** | **number** |  | [optional] [default to undefined]
**content** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Issue } from './api';

const instance: Issue = {
    links,
    id,
    repository,
    title,
    reporter,
    assignee,
    created_on,
    updated_on,
    edited_on,
    state,
    kind,
    priority,
    milestone,
    version,
    component,
    votes,
    content,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
