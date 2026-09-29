# CustomMergeCheck


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**check** | **{ [key: string]: any; }** | Identifies which custom check this is, as &#x60;{\&#39;type\&#39;: \&#39;custom_merge_check_definition\&#39;, \&#39;id\&#39;: \&#39;...\&#39;, \&#39;name\&#39;: \&#39;...\&#39;}&#x60;, where &#x60;id&#x60; is the ARI of the custom check extension. | [default to undefined]
**uuid** | **string** | Present when a persisted result exists: the persisted custom check result UUID. Omitted for on-merge checks known but not yet triggered. | [optional] [default to undefined]
**message** | **string** | Present when the custom check provides one; omitted when absent. | [optional] [default to undefined]

## Example

```typescript
import { CustomMergeCheck } from './api';

const instance: CustomMergeCheck = {
    type,
    check,
    uuid,
    message,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
