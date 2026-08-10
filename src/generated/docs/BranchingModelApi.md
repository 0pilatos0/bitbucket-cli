# BranchingModelApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**repositoriesWorkspaceRepoSlugBranchingModelGet**](#repositoriesworkspacereposlugbranchingmodelget) | **GET** /repositories/{workspace}/{repo_slug}/branching-model | Get the branching model for a repository|
|[**repositoriesWorkspaceRepoSlugBranchingModelSettingsGet**](#repositoriesworkspacereposlugbranchingmodelsettingsget) | **GET** /repositories/{workspace}/{repo_slug}/branching-model/settings | Get the branching model config for a repository|
|[**repositoriesWorkspaceRepoSlugBranchingModelSettingsPut**](#repositoriesworkspacereposlugbranchingmodelsettingsput) | **PUT** /repositories/{workspace}/{repo_slug}/branching-model/settings | Update the branching model config for a repository|
|[**repositoriesWorkspaceRepoSlugEffectiveBranchingModelGet**](#repositoriesworkspacereposlugeffectivebranchingmodelget) | **GET** /repositories/{workspace}/{repo_slug}/effective-branching-model | Get the effective, or currently applied, branching model for a repository|
|[**workspacesWorkspaceProjectsProjectKeyBranchingModelGet**](#workspacesworkspaceprojectsprojectkeybranchingmodelget) | **GET** /workspaces/{workspace}/projects/{project_key}/branching-model | Get the branching model for a project|
|[**workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsGet**](#workspacesworkspaceprojectsprojectkeybranchingmodelsettingsget) | **GET** /workspaces/{workspace}/projects/{project_key}/branching-model/settings | Get the branching model config for a project|
|[**workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsPut**](#workspacesworkspaceprojectsprojectkeybranchingmodelsettingsput) | **PUT** /workspaces/{workspace}/projects/{project_key}/branching-model/settings | Update the branching model config for a project|

# **repositoriesWorkspaceRepoSlugBranchingModelGet**
> BranchingModel repositoriesWorkspaceRepoSlugBranchingModelGet()

Return the branching model as applied to the repository. This view is read-only. The branching model settings can be changed using the [settings](#api-repositories-workspace-repo-slug-branching-model-settings-get) API.  The returned object:  1. Always has a `development` property. `development.branch` contains    the actual repository branch object that is considered to be the    `development` branch. `development.branch` will not be present    if it does not exist. 2. Might have a `production` property. `production` will not    be present when `production` is disabled.    `production.branch` contains the actual branch object that is    considered to be the `production` branch. `production.branch` will    not be present if it does not exist. 3. Always has a `branch_types` array which contains all enabled branch    types.

### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchingModelGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**BranchingModel**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The branching model object |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have read access to the repository |  -  |
|**404** | If the repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugBranchingModelSettingsGet**
> BranchingModelSettings repositoriesWorkspaceRepoSlugBranchingModelSettingsGet()

Return the branching model configuration for a repository. The returned object:  1. Always has a `development` property for the development branch. 2. Always a `production` property for the production branch. The    production branch can be disabled. 3. The `branch_types` contains all the branch types. 4. `default_branch_deletion` indicates whether branches will be     deleted by default on merge.  This is the raw configuration for the branching model. A client wishing to see the branching model with its actual current branches may find the [active model API](/cloud/bitbucket/rest/api-group-branching-model/#api-repositories-workspace-repo-slug-branching-model-get) more useful.

### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchingModelSettingsGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**BranchingModelSettings**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The branching model configuration |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugBranchingModelSettingsPut**
> BranchingModelSettings repositoriesWorkspaceRepoSlugBranchingModelSettingsPut()

Update the branching model configuration for a repository.  The `development` branch can be configured to a specific branch or to track the main branch. When set to a specific branch it must currently exist. Only the passed properties will be updated. The properties not passed will be left unchanged. A request without a `development` property will leave the development branch unchanged.  It is possible for the `development` branch to be invalid. This happens when it points at a specific branch that has been deleted. This is indicated in the `is_valid` field for the branch. It is not possible to update the settings for `development` if that would leave the branch in an invalid state. Such a request will be rejected.  The `production` branch can be a specific branch, the main branch or disabled. When set to a specific branch it must currently exist. The `enabled` property can be used to enable (`true`) or disable (`false`) it. Only the passed properties will be updated. The properties not passed will be left unchanged. A request without a `production` property will leave the production branch unchanged.  It is possible for the `production` branch to be invalid. This happens when it points at a specific branch that has been deleted. This is indicated in the `is_valid` field for the branch. A request that would leave `production` enabled and invalid will be rejected. It is possible to update `production` and make it invalid if it would also be left disabled.  The `branch_types` property contains the branch types to be updated. Only the branch types passed will be updated. All updates will be rejected if it would leave the branching model in an invalid state. For branch types this means that:  1. The prefixes for all enabled branch types are valid. For example,    it is not possible to use \'*\' inside a Git prefix. 2. A prefix of an enabled branch type must not be a prefix of another    enabled branch type. This is to ensure that a branch can be easily    classified by its prefix unambiguously.  It is possible to store an invalid prefix if that branch type would be left disabled. Only the passed properties will be updated. The properties not passed will be left unchanged. Each branch type must have a `kind` property to identify it.  The `default_branch_deletion` property is a string. The value of `true` indicates to delete branches by default. The value of `false` indicates that branches will not be deleted by default. A request without a `default_branch_deletion` property will leave it unchanged. Other values would be ignored.  There is currently a side effect when using this API endpoint. If the repository is inheriting branching model settings from its project, updating the branching model for this repository will disable the project setting inheritance.   We have deprecated this side effect and will remove it on 1 August 2022.

### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchingModelSettingsPut(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**BranchingModelSettings**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated branching model configuration |  -  |
|**400** | If the request contains invalid branching model configuration |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugEffectiveBranchingModelGet**
> EffectiveRepoBranchingModel repositoriesWorkspaceRepoSlugEffectiveBranchingModelGet()


### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugEffectiveBranchingModelGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**EffectiveRepoBranchingModel**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The effective branching model object |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have read access to the repository |  -  |
|**404** | If the repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyBranchingModelGet**
> ProjectBranchingModel workspacesWorkspaceProjectsProjectKeyBranchingModelGet()

Return the branching model set at the project level. This view is read-only. The branching model settings can be changed using the [settings](#api-workspaces-workspace-projects-project-key-branching-model-settings-get) API.  The returned object:  1. Always has a `development` property. `development.name` is    the user-specified branch that can be inherited by an individual repository\'s    branching model. 2. Might have a `production` property. `production` will not    be present when `production` is disabled.    `production.name` is the user-specified branch that can be    inherited by an individual repository\'s branching model. 3. Always has a `branch_types` array which contains all enabled branch    types.

### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyBranchingModelGet(
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual &#x60;key&#x60; assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ProjectBranchingModel**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The branching model object |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have read access to the project |  -  |
|**404** | If the project does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsGet**
> BranchingModelSettings workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsGet()

Return the branching model configuration for a project. The returned object:  1. Always has a `development` property for the development branch. 2. Always a `production` property for the production branch. The    production branch can be disabled. 3. The `branch_types` contains all the branch types. 4. `default_branch_deletion` indicates whether branches will be     deleted by default on merge.   This is the raw configuration for the branching model. A client wishing to see the branching model with its actual current branches may find the [active model API](#api-workspaces-workspace-projects-project-key-branching-model-get) more useful.

### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsGet(
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual &#x60;key&#x60; assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**BranchingModelSettings**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The branching model configuration |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the project |  -  |
|**404** | If the project does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsPut**
> BranchingModelSettings workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsPut()

Update the branching model configuration for a project.  The `development` branch can be configured to a specific branch or to track the main branch. Any branch name can be supplied, but will only successfully be applied to a repository via inheritance if that branch exists for that repository. Only the passed properties will be updated. The properties not passed will be left unchanged. A request without a `development` property will leave the development branch unchanged.  The `production` branch can be a specific branch, the main branch or disabled. Any branch name can be supplied, but will only successfully be applied to a repository via inheritance if that branch exists for that repository. The `enabled` property can be used to enable (`true`) or disable (`false`) it. Only the passed properties will be updated. The properties not passed will be left unchanged. A request without a `production` property will leave the production branch unchanged.  The `branch_types` property contains the branch types to be updated. Only the branch types passed will be updated. All updates will be rejected if it would leave the branching model in an invalid state. For branch types this means that:  1. The prefixes for all enabled branch types are valid. For example,    it is not possible to use \'*\' inside a Git prefix. 2. A prefix of an enabled branch type must not be a prefix of another    enabled branch type. This is to ensure that a branch can be easily    classified by its prefix unambiguously.  It is possible to store an invalid prefix if that branch type would be left disabled. Only the passed properties will be updated. The properties not passed will be left unchanged. Each branch type must have a `kind` property to identify it.  The `default_branch_deletion` property is a string. The value of `true` indicates to delete branches by default. The value of `false` indicates that branches will not be deleted by default. A request without a `default_branch_deletion` property will leave it unchanged. Other values would be ignored.

### Example

```typescript
import {
    BranchingModelApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchingModelApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyBranchingModelSettingsPut(
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual &#x60;key&#x60; assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**BranchingModelSettings**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated branching model configuration |  -  |
|**400** | If the request contains an invalid branching model configuration |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the project |  -  |
|**404** | If the project does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

