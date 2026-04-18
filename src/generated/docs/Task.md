# Task

A task object.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [optional] [default to undefined]
**created_on** | **string** |  | [default to undefined]
**updated_on** | **string** |  | [default to undefined]
**state** | **string** |  | [default to undefined]
**content** | [**TaskContent**](TaskContent.md) |  | [default to undefined]
**creator** | [**Account**](Account.md) |  | [default to undefined]
**pending** | **boolean** |  | [optional] [default to undefined]
**resolved_on** | **string** | The ISO8601 timestamp for when the task was resolved. | [optional] [default to undefined]
**resolved_by** | [**Account**](Account.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Task } from './api';

const instance: Task = {
    id,
    created_on,
    updated_on,
    state,
    content,
    creator,
    pending,
    resolved_on,
    resolved_by,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
