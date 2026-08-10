# BranchRestrictionsApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**repositoriesWorkspaceRepoSlugBranchRestrictionsGet**](#repositoriesworkspacereposlugbranchrestrictionsget) | **GET** /repositories/{workspace}/{repo_slug}/branch-restrictions | List branch restrictions|
|[**repositoriesWorkspaceRepoSlugBranchRestrictionsIdDelete**](#repositoriesworkspacereposlugbranchrestrictionsiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/branch-restrictions/{id} | Delete a branch restriction rule|
|[**repositoriesWorkspaceRepoSlugBranchRestrictionsIdGet**](#repositoriesworkspacereposlugbranchrestrictionsidget) | **GET** /repositories/{workspace}/{repo_slug}/branch-restrictions/{id} | Get a branch restriction rule|
|[**repositoriesWorkspaceRepoSlugBranchRestrictionsIdPut**](#repositoriesworkspacereposlugbranchrestrictionsidput) | **PUT** /repositories/{workspace}/{repo_slug}/branch-restrictions/{id} | Update a branch restriction rule|
|[**repositoriesWorkspaceRepoSlugBranchRestrictionsPost**](#repositoriesworkspacereposlugbranchrestrictionspost) | **POST** /repositories/{workspace}/{repo_slug}/branch-restrictions | Create a branch restriction rule|

# **repositoriesWorkspaceRepoSlugBranchRestrictionsGet**
> PaginatedBranchrestrictions repositoriesWorkspaceRepoSlugBranchRestrictionsGet()

Returns a paginated list of all branch restrictions on the repository.

### Example

```typescript
import {
    BranchRestrictionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchRestrictionsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let kind: string; //Branch restrictions of this type (optional) (default to undefined)
let pattern: string; //Branch restrictions applied to branches of this pattern (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchRestrictionsGet(
    repoSlug,
    workspace,
    kind,
    pattern
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **kind** | [**string**] | Branch restrictions of this type | (optional) defaults to undefined|
| **pattern** | [**string**] | Branch restrictions applied to branches of this pattern | (optional) defaults to undefined|


### Return type

**PaginatedBranchrestrictions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of branch restrictions |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugBranchRestrictionsIdDelete**
> repositoriesWorkspaceRepoSlugBranchRestrictionsIdDelete()

Deletes an existing branch restriction rule.

### Example

```typescript
import {
    BranchRestrictionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchRestrictionsApi(configuration);

let id: string; //The restriction rule\'s id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchRestrictionsIdDelete(
    id,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | The restriction rule\&#39;s id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** |  |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository or branch restriction id does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugBranchRestrictionsIdGet**
> Branchrestriction repositoriesWorkspaceRepoSlugBranchRestrictionsIdGet()

Returns a specific branch restriction rule.

### Example

```typescript
import {
    BranchRestrictionsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchRestrictionsApi(configuration);

let id: string; //The restriction rule\'s id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchRestrictionsIdGet(
    id,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | The restriction rule\&#39;s id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Branchrestriction**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The branch restriction rule |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository or branch restriction id does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugBranchRestrictionsIdPut**
> Branchrestriction repositoriesWorkspaceRepoSlugBranchRestrictionsIdPut(body)

Updates an existing branch restriction rule.  Fields not present in the request body are ignored.  See [`POST`](/cloud/bitbucket/rest/api-group-branch-restrictions/#api-repositories-workspace-repo-slug-branch-restrictions-post) for details.

### Example

```typescript
import {
    BranchRestrictionsApi,
    Configuration,
    Branchrestriction
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchRestrictionsApi(configuration);

let id: string; //The restriction rule\'s id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Branchrestriction; //The new version of the existing rule

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchRestrictionsIdPut(
    id,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Branchrestriction**| The new version of the existing rule | |
| **id** | [**string**] | The restriction rule\&#39;s id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Branchrestriction**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated branch restriction rule |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository or branch restriction id does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugBranchRestrictionsPost**
> Branchrestriction repositoriesWorkspaceRepoSlugBranchRestrictionsPost(body)

Creates a new branch restriction rule for a repository.  `kind` describes what will be restricted. Allowed values include: `push`, `force`, `delete`, `restrict_merges`, `require_tasks_to_be_completed`, `require_approvals_to_merge`, `require_default_reviewer_approvals_to_merge`, `require_no_changes_requested`, `require_passing_builds_to_merge`, `require_commits_behind`, `reset_pullrequest_approvals_on_change`, `smart_reset_pullrequest_approvals`, `reset_pullrequest_changes_requested_on_change`, `require_all_dependencies_merged`, `enforce_merge_checks`, and `allow_auto_merge_when_builds_pass`.  Different kinds of branch restrictions have different requirements:  * `push` and `restrict_merges` require `users` and `groups` to be   specified. Empty lists are allowed, in which case permission is   denied for everybody.  The restriction applies to all branches that match. There are two ways to match a branch. It is configured in `branch_match_kind`:  1. `glob`: Matches a branch against the `pattern`. A `\'*\'` in    `pattern` will expand to match zero or more characters, and every    other character matches itself. For example, `\'foo*\'` will match    `\'foo\'` and `\'foobar\'`, but not `\'barfoo\'`. `\'*\'` will match all    branches. 2. `branching_model`: Matches a branch against the repository\'s    branching model. The `branch_type` controls the type of branch    to match. Allowed values include: `production`, `development`,    `bugfix`, `release`, `feature` and `hotfix`.  The combination of `kind` and match must be unique. This means that two `glob` restrictions in a repository cannot have the same `kind` and `pattern`. Additionally, two `branching_model` restrictions in a repository cannot have the same `kind` and `branch_type`.  `users` and `groups` are lists of users and groups that are except from the restriction. They can only be configured in `push` and `restrict_merges` restrictions. The `push` restriction stops a user pushing to matching branches unless that user is in `users` or is a member of a group in `groups`. The `restrict_merges` stops a user merging pull requests to matching branches unless that user is in `users` or is a member of a group in `groups`. Adding new users or groups to an existing restriction should be done via `PUT`.  Note that branch restrictions with overlapping matchers is allowed, but the resulting behavior may be surprising.

### Example

```typescript
import {
    BranchRestrictionsApi,
    Configuration,
    Branchrestriction
} from './api';

const configuration = new Configuration();
const apiInstance = new BranchRestrictionsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Branchrestriction; //The new rule

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugBranchRestrictionsPost(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Branchrestriction**| The new rule | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Branchrestriction**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | A paginated list of branch restrictions |  -  |
|**401** | If the request was not authenticated |  -  |
|**403** | If the authenticated user does not have admin access to the repository |  -  |
|**404** | If the repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

