# StandardMergeCheck


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [default to undefined]
**required** | **boolean** | Whether merge-check enforcement is currently active for the pull request (a repository-wide setting), not a property of the individual check. | [default to undefined]
**blocking** | **boolean** | Whether this check is currently preventing the pull request from being merged. | [default to undefined]
**check** | **{ [key: string]: any; }** | Identifies which branch-restriction-backed check this is, as &#x60;{\&#39;type\&#39;: \&#39;standard_merge_check_definition\&#39;, \&#39;kind\&#39;: \&#39;...\&#39;}&#x60;. See &#x60;check.kind&#x60; in the endpoint documentation for the full list of supported kinds. | [default to undefined]
**requirement** | **{ [key: string]: any; }** | The configured threshold for this check, keyed by a check.kind-specific field name (e.g. &#x60;{\&#39;minimum_approvals\&#39;: 2}&#x60;). The shape varies per &#x60;check.kind&#x60;. | [default to undefined]
**observed** | **{ [key: string]: any; }** | The current observed value for this check, keyed by a check.kind-specific field name (e.g. &#x60;{\&#39;approval_count\&#39;: 1}&#x60;). The shape varies per &#x60;check.kind&#x60;. | [default to undefined]

## Example

```typescript
import { StandardMergeCheck } from './api';

const instance: StandardMergeCheck = {
    type,
    required,
    blocking,
    check,
    requirement,
    observed,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
