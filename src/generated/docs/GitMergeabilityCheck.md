# GitMergeabilityCheck


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**reason** | **string** | Present when &#x60;status&#x60; is &#x60;PASSED&#x60; or &#x60;FAILED&#x60;: the Git-level outcome for the selected source and destination heads. Omitted when &#x60;status&#x60; is &#x60;UNKNOWN&#x60; (Bitbucket could not evaluate Git mergeability, e.g. due to a timeout); this doesn\&#39;t imply the pull request is conflict-free. | [optional] [default to undefined]
**links** | **{ [key: string]: any; }** | Present when this check is blocking: &#x60;{\&#39;details\&#39;: {\&#39;href\&#39;: \&#39;...\&#39;}}&#x60;, linking to this pull request\&#39;s &#x60;conflicts&#x60; endpoint. | [optional] [default to undefined]

## Example

```typescript
import { GitMergeabilityCheck } from './api';

const instance: GitMergeabilityCheck = {
    type,
    reason,
    links,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
