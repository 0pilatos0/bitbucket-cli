# CommitStatusesApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyGet**](#repositoriesworkspacereposlugcommitcommitstatusesbuildkeyget) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key} | Get a build status for a commit|
|[**repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyPut**](#repositoriesworkspacereposlugcommitcommitstatusesbuildkeyput) | **PUT** /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key} | Update a build status for a commit|
|[**repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildPost**](#repositoriesworkspacereposlugcommitcommitstatusesbuildpost) | **POST** /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build | Create a build status for a commit|
|[**repositoriesWorkspaceRepoSlugCommitCommitStatusesGet**](#repositoriesworkspacereposlugcommitcommitstatusesget) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/statuses | List commit statuses for a commit|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet**](#repositoriesworkspacereposlugpullrequestspullrequestidstatusesget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/statuses | List commit statuses for a pull request|

# **repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyGet**
> Commitstatus repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyGet()

Returns the specified build status for a commit.

### Example

```typescript
import {
    CommitStatusesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitStatusesApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let key: string; //The build status\' unique key (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyGet(
    commit,
    key,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **key** | [**string**] | The build status\&#39; unique key | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Commitstatus**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The build status object with the specified key. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the repository, commit, or build status key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyPut**
> Commitstatus repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyPut()

Used to update the current status of a build status object on the specific commit.  This operation can also be used to change other properties of the build status:  * `state` * `name` * `description` * `url` * `refname`  The `key` cannot be changed.

### Example

```typescript
import {
    CommitStatusesApi,
    Configuration,
    Commitstatus
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitStatusesApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let key: string; //The build status\' unique key (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Commitstatus; //The updated build status object (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildKeyPut(
    commit,
    key,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Commitstatus**| The updated build status object | |
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **key** | [**string**] | The build status\&#39; unique key | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Commitstatus**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated build status object. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the repository or build does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildPost**
> Commitstatus repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildPost()

Creates a new build status against the specified commit.  If the specified key already exists, the existing status object will be overwritten.  Example:  ``` curl https://api.bitbucket.org/2.0/repositories/my-workspace/my-repo/commit/e10dae226959c2194f2b07b077c07762d93821cf/statuses/build/           -X POST -u jdoe -H \'Content-Type: application/json\'           -d \'{     \"key\": \"MY-BUILD\",     \"state\": \"SUCCESSFUL\",     \"description\": \"42 tests passed\",     \"url\": \"https://www.example.org/my-build-result\"   }\' ```  When creating a new commit status, you can use a URI template for the URL. Templates are URLs that contain variable names that Bitbucket will evaluate at runtime whenever the URL is displayed anywhere similar to parameter substitution in [Bitbucket Connect](https://developer.atlassian.com/bitbucket/concepts/context-parameters.html). For example, one could use `https://foo.com/builds/{repository.full_name}` which Bitbucket will turn into `https://foo.com/builds/foo/bar` at render time. The context variables available are `repository` and `commit`.  To associate a commit status to a pull request, the refname field must be set to the source branch of the pull request.  Example: ``` curl https://api.bitbucket.org/2.0/repositories/my-workspace/my-repo/commit/e10dae226959c2194f2b07b077c07762d93821cf/statuses/build/           -X POST -u jdoe -H \'Content-Type: application/json\'           -d \'{     \"key\": \"MY-BUILD\",     \"state\": \"SUCCESSFUL\",     \"description\": \"42 tests passed\",     \"url\": \"https://www.example.org/my-build-result\",     \"refname\": \"my-pr-branch\"   }\' ```

### Example

```typescript
import {
    CommitStatusesApi,
    Configuration,
    Commitstatus
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitStatusesApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Commitstatus; //The new commit status object. (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitStatusesBuildPost(
    commit,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Commitstatus**| The new commit status object. | |
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Commitstatus**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created build status object. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the repository, commit, or build status key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitStatusesGet**
> PaginatedCommitstatuses repositoriesWorkspaceRepoSlugCommitCommitStatusesGet()

Returns all statuses (e.g. build results) for a specific commit.

### Example

```typescript
import {
    CommitStatusesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitStatusesApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let refname: string; //If specified, only return commit status objects that were either created without a refname, or were created with the specified refname  (optional) (default to undefined)
let q: string; //Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)
let sort: string; //Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to `created_on`.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitStatusesGet(
    commit,
    repoSlug,
    workspace,
    refname,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **refname** | [**string**] | If specified, only return commit status objects that were either created without a refname, or were created with the specified refname  | (optional) defaults to undefined|
| **q** | [**string**] | Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|
| **sort** | [**string**] | Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to &#x60;created_on&#x60;.  | (optional) defaults to undefined|


### Return type

**PaginatedCommitstatuses**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of all commit statuses for this commit. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the repository or commit does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet**
> PaginatedCommitstatuses repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet()

Returns all statuses (e.g. build results) for the given pull request.

### Example

```typescript
import {
    CommitStatusesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitStatusesApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; //Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)
let sort: string; //Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to `created_on`.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet(
    pullRequestId,
    repoSlug,
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] | Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|
| **sort** | [**string**] | Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to &#x60;created_on&#x60;.  | (optional) defaults to undefined|


### Return type

**PaginatedCommitstatuses**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of all commit statuses for this pull request. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the specified repository or pull request does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

