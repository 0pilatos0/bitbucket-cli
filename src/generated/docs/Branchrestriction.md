# Branchrestriction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | **object** |  | [optional] [default to undefined]
**id** | **number** | The branch restriction status\&#39; id. | [optional] [default to undefined]
**kind** | **string** | The type of restriction that is being applied. | [default to undefined]
**branch_match_kind** | **string** | Indicates how the restriction is matched against a branch. The default is &#x60;glob&#x60;. | [default to undefined]
**branch_type** | **string** | Apply the restriction to branches of this type. Active when &#x60;branch_match_kind&#x60; is &#x60;branching_model&#x60;. The branch type will be calculated using the branching model configured for the repository. | [optional] [default to undefined]
**pattern** | **string** | Apply the restriction to branches that match this pattern. Active when &#x60;branch_match_kind&#x60; is &#x60;glob&#x60;. Will be empty when &#x60;branch_match_kind&#x60; is &#x60;branching_model&#x60;. | [default to undefined]
**value** | **number** | Value with kind-specific semantics:  * &#x60;require_approvals_to_merge&#x60; uses it to require a minimum number of approvals on a PR.  * &#x60;require_default_reviewer_approvals_to_merge&#x60; uses it to require a minimum number of approvals from default reviewers on a PR.  * &#x60;require_passing_builds_to_merge&#x60; uses it to require a minimum number of passing builds.  * &#x60;require_commits_behind&#x60; uses it to require the current branch is up to a maximum number of commits behind it destination. | [optional] [default to undefined]
**users** | [**Array&lt;Account&gt;**](Account.md) |  | [optional] [default to undefined]
**groups** | [**Array&lt;Group&gt;**](Group.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Branchrestriction } from './api';

const instance: Branchrestriction = {
    links,
    id,
    kind,
    branch_match_kind,
    branch_type,
    pattern,
    value,
    users,
    groups,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
