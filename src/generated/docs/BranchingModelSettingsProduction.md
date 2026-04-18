# BranchingModelSettingsProduction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**is_valid** | **boolean** | Indicates if the configured branch is valid, that is, if the configured branch actually exists currently. Is always &#x60;true&#x60; when &#x60;use_mainbranch&#x60; is &#x60;true&#x60; (even if the main branch does not exist). This field is read-only. This field is ignored when updating/creating settings. | [optional] [default to undefined]
**name** | **string** | The configured branch. It must be &#x60;null&#x60; when &#x60;use_mainbranch&#x60; is &#x60;true&#x60;. Otherwise it must be a non-empty value. It is possible for the configured branch to not exist (e.g. it was deleted after the settings are set). In this case &#x60;is_valid&#x60; will be &#x60;false&#x60;. The branch must exist when updating/setting the &#x60;name&#x60; or an error will occur. | [optional] [default to undefined]
**use_mainbranch** | **boolean** | Indicates if the setting points at an explicit branch (&#x60;false&#x60;) or tracks the main branch (&#x60;true&#x60;). When &#x60;true&#x60; the &#x60;name&#x60; must be &#x60;null&#x60; or not provided. When &#x60;false&#x60; the &#x60;name&#x60; must contain a non-empty branch name. | [optional] [default to undefined]
**enabled** | **boolean** | Indicates if branch is enabled or not. | [optional] [default to undefined]

## Example

```typescript
import { BranchingModelSettingsProduction } from './api';

const instance: BranchingModelSettingsProduction = {
    is_valid,
    name,
    use_mainbranch,
    enabled,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
