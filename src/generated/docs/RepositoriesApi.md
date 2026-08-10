# RepositoriesApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**repositoriesGet**](#repositoriesget) | **GET** /repositories | List public repositories|
|[**repositoriesWorkspaceGet**](#repositoriesworkspaceget) | **GET** /repositories/{workspace} | List repositories in a workspace|
|[**repositoriesWorkspaceRepoSlugDelete**](#repositoriesworkspacereposlugdelete) | **DELETE** /repositories/{workspace}/{repo_slug} | Delete a repository|
|[**repositoriesWorkspaceRepoSlugFilehistoryCommitPathGet**](#repositoriesworkspacereposlugfilehistorycommitpathget) | **GET** /repositories/{workspace}/{repo_slug}/filehistory/{commit}/{path} | List commits that modified a file|
|[**repositoriesWorkspaceRepoSlugForksGet**](#repositoriesworkspacereposlugforksget) | **GET** /repositories/{workspace}/{repo_slug}/forks | List repository forks|
|[**repositoriesWorkspaceRepoSlugForksPost**](#repositoriesworkspacereposlugforkspost) | **POST** /repositories/{workspace}/{repo_slug}/forks | Fork a repository|
|[**repositoriesWorkspaceRepoSlugGet**](#repositoriesworkspacereposlugget) | **GET** /repositories/{workspace}/{repo_slug} | Get a repository|
|[**repositoriesWorkspaceRepoSlugHooksGet**](#repositoriesworkspacereposlughooksget) | **GET** /repositories/{workspace}/{repo_slug}/hooks | List webhooks for a repository|
|[**repositoriesWorkspaceRepoSlugHooksPost**](#repositoriesworkspacereposlughookspost) | **POST** /repositories/{workspace}/{repo_slug}/hooks | Create a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugHooksUidDelete**](#repositoriesworkspacereposlughooksuiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Delete a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugHooksUidGet**](#repositoriesworkspacereposlughooksuidget) | **GET** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Get a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugHooksUidPut**](#repositoriesworkspacereposlughooksuidput) | **PUT** /repositories/{workspace}/{repo_slug}/hooks/{uid} | Update a webhook for a repository|
|[**repositoriesWorkspaceRepoSlugOverrideSettingsGet**](#repositoriesworkspacereposlugoverridesettingsget) | **GET** /repositories/{workspace}/{repo_slug}/override-settings | Retrieve the inheritance state for repository settings|
|[**repositoriesWorkspaceRepoSlugOverrideSettingsPut**](#repositoriesworkspacereposlugoverridesettingsput) | **PUT** /repositories/{workspace}/{repo_slug}/override-settings | Set the inheritance state for repository settings                 |
|[**repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGet**](#repositoriesworkspacereposlugpermissionsconfiggroupsget) | **GET** /repositories/{workspace}/{repo_slug}/permissions-config/groups | List explicit group permissions for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugDelete**](#repositoriesworkspacereposlugpermissionsconfiggroupsgroupslugdelete) | **DELETE** /repositories/{workspace}/{repo_slug}/permissions-config/groups/{group_slug} | Delete an explicit group permission for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugGet**](#repositoriesworkspacereposlugpermissionsconfiggroupsgroupslugget) | **GET** /repositories/{workspace}/{repo_slug}/permissions-config/groups/{group_slug} | Get an explicit group permission for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugPut**](#repositoriesworkspacereposlugpermissionsconfiggroupsgroupslugput) | **PUT** /repositories/{workspace}/{repo_slug}/permissions-config/groups/{group_slug} | Update an explicit group permission for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigUsersGet**](#repositoriesworkspacereposlugpermissionsconfigusersget) | **GET** /repositories/{workspace}/{repo_slug}/permissions-config/users | List explicit user permissions for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdDelete**](#repositoriesworkspacereposlugpermissionsconfigusersselecteduseriddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/permissions-config/users/{selected_user_id} | Delete an explicit user permission for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdGet**](#repositoriesworkspacereposlugpermissionsconfigusersselecteduseridget) | **GET** /repositories/{workspace}/{repo_slug}/permissions-config/users/{selected_user_id} | Get an explicit user permission for a repository|
|[**repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdPut**](#repositoriesworkspacereposlugpermissionsconfigusersselecteduseridput) | **PUT** /repositories/{workspace}/{repo_slug}/permissions-config/users/{selected_user_id} | Update an explicit user permission for a repository|
|[**repositoriesWorkspaceRepoSlugPost**](#repositoriesworkspacereposlugpost) | **POST** /repositories/{workspace}/{repo_slug} | Create a repository|
|[**repositoriesWorkspaceRepoSlugPut**](#repositoriesworkspacereposlugput) | **PUT** /repositories/{workspace}/{repo_slug} | Update a repository|
|[**repositoriesWorkspaceRepoSlugSrcCommitPathGet**](#repositoriesworkspacereposlugsrccommitpathget) | **GET** /repositories/{workspace}/{repo_slug}/src/{commit}/{path} | Get file or directory contents|
|[**repositoriesWorkspaceRepoSlugSrcGet**](#repositoriesworkspacereposlugsrcget) | **GET** /repositories/{workspace}/{repo_slug}/src | Get the root directory of the main branch|
|[**repositoriesWorkspaceRepoSlugSrcPost**](#repositoriesworkspacereposlugsrcpost) | **POST** /repositories/{workspace}/{repo_slug}/src | Create a commit by uploading a file|
|[**repositoriesWorkspaceRepoSlugWatchersGet**](#repositoriesworkspacereposlugwatchersget) | **GET** /repositories/{workspace}/{repo_slug}/watchers | List repositories watchers|
|[**userPermissionsRepositoriesGet**](#userpermissionsrepositoriesget) | **GET** /user/permissions/repositories | List repository permissions for a user|
|[**userWorkspacesWorkspacePermissionsRepositoriesGet**](#userworkspacesworkspacepermissionsrepositoriesget) | **GET** /user/workspaces/{workspace}/permissions/repositories | List repository permissions in a workspace for a user|

# **repositoriesGet**
> PaginatedRepositories repositoriesGet()

**This endpoint is deprecated. Please use the [workspace scoped alternative](/cloud/bitbucket/rest/api-group-repositories/#api-repositories-workspace-get).**  Returns a paginated list of all public repositories.  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let after: string; //Filter the results to include only repositories created on or after this [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601)  timestamp. Example: `YYYY-MM-DDTHH:mm:ss.sssZ` (optional) (default to undefined)
let role: 'admin' | 'contributor' | 'member' | 'owner'; //Filters the result based on the authenticated user\'s role on each repository.  * **member**: returns repositories to which the user has explicit read access * **contributor**: returns repositories to which the user has explicit write access * **admin**: returns repositories to which the user has explicit administrator access * **owner**: returns all repositories owned by the current user  (optional) (default to undefined)
let q: string; //Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). `role` parameter must also be specified.  (optional) (default to undefined)
let sort: string; //Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesGet(
    after,
    role,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **after** | [**string**] | Filter the results to include only repositories created on or after this [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601)  timestamp. Example: &#x60;YYYY-MM-DDTHH:mm:ss.sssZ&#x60; | (optional) defaults to undefined|
| **role** | [**&#39;admin&#39; | &#39;contributor&#39; | &#39;member&#39; | &#39;owner&#39;**]**Array<&#39;admin&#39; &#124; &#39;contributor&#39; &#124; &#39;member&#39; &#124; &#39;owner&#39;>** | Filters the result based on the authenticated user\&#39;s role on each repository.  * **member**: returns repositories to which the user has explicit read access * **contributor**: returns repositories to which the user has explicit write access * **admin**: returns repositories to which the user has explicit administrator access * **owner**: returns all repositories owned by the current user  | (optional) defaults to undefined|
| **q** | [**string**] | Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). &#x60;role&#x60; parameter must also be specified.  | (optional) defaults to undefined|
| **sort** | [**string**] | Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|


### Return type

**PaginatedRepositories**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | All public repositories. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceGet**
> PaginatedRepositories repositoriesWorkspaceGet()

Returns a paginated list of all repositories owned by the specified workspace.  The result can be narrowed down based on the authenticated user\'s role.  E.g. with `?role=contributor`, only those repositories that the authenticated user has write access to are returned (this includes any repo the user is an admin on, as that implies write access).  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let role: 'admin' | 'contributor' | 'member' | 'owner'; // Filters the result based on the authenticated user\'s role on each repository.  * **member**: returns repositories to which the user has explicit read access * **contributor**: returns repositories to which the user has explicit write access * **admin**: returns repositories to which the user has explicit administrator access * **owner**: returns all repositories owned by the current user  (optional) (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)
let sort: string; // Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).          (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceGet(
    workspace,
    role,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **role** | [**&#39;admin&#39; | &#39;contributor&#39; | &#39;member&#39; | &#39;owner&#39;**]**Array<&#39;admin&#39; &#124; &#39;contributor&#39; &#124; &#39;member&#39; &#124; &#39;owner&#39;>** |  Filters the result based on the authenticated user\&#39;s role on each repository.  * **member**: returns repositories to which the user has explicit read access * **contributor**: returns repositories to which the user has explicit write access * **admin**: returns repositories to which the user has explicit administrator access * **owner**: returns all repositories owned by the current user  | (optional) defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|
| **sort** | [**string**] |  Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).          | (optional) defaults to undefined|


### Return type

**PaginatedRepositories**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repositories owned by the specified account. |  -  |
|**404** | If the specified account does not exist. |  -  |
|**410** | If the specified account marked as spam. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDelete**
> repositoriesWorkspaceRepoSlugDelete()

Deletes the repository. This is an irreversible operation.  This does not affect its forks.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let redirectTo: string; //If a repository has been moved to a new location, use this parameter to show users a friendly message in the Bitbucket UI that the repository has moved to a new location. However, a GET to this endpoint will still return a 404.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDelete(
    repoSlug,
    workspace,
    redirectTo
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **redirectTo** | [**string**] | If a repository has been moved to a new location, use this parameter to show users a friendly message in the Bitbucket UI that the repository has moved to a new location. However, a GET to this endpoint will still return a 404.  | (optional) defaults to undefined|


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
|**204** | Indicates successful deletion. |  -  |
|**403** | If the caller either does not have admin access to the repository, or the repository is set to read-only. |  -  |
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugFilehistoryCommitPathGet**
> PaginatedFiles repositoriesWorkspaceRepoSlugFilehistoryCommitPathGet()

Returns a paginated list of commits that modified the specified file.  Commits are returned in reverse chronological order. This is roughly equivalent to the following commands:      $ git log --follow --date-order <sha> <path>  By default, Bitbucket will follow renames and the path name in the returned entries reflects that. This can be turned off using the `?renames=false` query parameter.  Results are returned in descending chronological order by default, and like most endpoints you can [filter and sort](/cloud/bitbucket/rest/intro/#filtering) the response to only provide exactly the data you want.  The example response returns commits made before 2011-05-18 against a file named `README.rst`. The results are filtered to only return the path and date. This request can be made using:  ``` $ curl \'https://api.bitbucket.org/2.0/repositories/evzijst/dogslow/filehistory/master/README.rst\'\\   \'?fields=values.next,values.path,values.commit.date&q=commit.date<=2011-05-18\' ```  In the response you can see that the file was renamed to `README.rst` by the commit made on 2011-05-16, and was previously named `README.txt`.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let path: string; //Path to the file. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let renames: string; // When `true`, Bitbucket will follow the history of the file across renames (this is the default behavior). This can be turned off by specifying `false`. (optional) (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)
let sort: string; // Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results).  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugFilehistoryCommitPathGet(
    commit,
    path,
    repoSlug,
    workspace,
    renames,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **path** | [**string**] | Path to the file. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **renames** | [**string**] |  When &#x60;true&#x60;, Bitbucket will follow the history of the file across renames (this is the default behavior). This can be turned off by specifying &#x60;false&#x60;. | (optional) defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results).  | (optional) defaults to undefined|


### Return type

**PaginatedFiles**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commits that modified the specified file |  -  |
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugForksGet**
> PaginatedRepositories repositoriesWorkspaceRepoSlugForksGet()

Returns a paginated list of all the forks of the specified repository.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let role: 'admin' | 'contributor' | 'member' | 'owner'; //Filters the result based on the authenticated user\'s role on each repository.  * **member**: returns repositories to which the user has explicit read access * **contributor**: returns repositories to which the user has explicit write access * **admin**: returns repositories to which the user has explicit administrator access * **owner**: returns all repositories owned by the current user  (optional) (default to undefined)
let q: string; //Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)
let sort: string; //Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugForksGet(
    repoSlug,
    workspace,
    role,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **role** | [**&#39;admin&#39; | &#39;contributor&#39; | &#39;member&#39; | &#39;owner&#39;**]**Array<&#39;admin&#39; &#124; &#39;contributor&#39; &#124; &#39;member&#39; &#124; &#39;owner&#39;>** | Filters the result based on the authenticated user\&#39;s role on each repository.  * **member**: returns repositories to which the user has explicit read access * **contributor**: returns repositories to which the user has explicit write access * **admin**: returns repositories to which the user has explicit administrator access * **owner**: returns all repositories owned by the current user  | (optional) defaults to undefined|
| **q** | [**string**] | Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|
| **sort** | [**string**] | Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|


### Return type

**PaginatedRepositories**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | All forks. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugForksPost**
> Repository repositoriesWorkspaceRepoSlugForksPost()

Creates a new fork of the specified repository.  #### Forking a repository  To create a fork, specify the workspace explicitly as part of the request body:  ``` $ curl -X POST -u jdoe https://api.bitbucket.org/2.0/repositories/atlassian/bbql/forks \\   -H \'Content-Type: application/json\' -d \'{     \"name\": \"bbql_fork\",     \"workspace\": {       \"slug\": \"atlassian\"     } }\' ```  To fork a repository into the same workspace, also specify a new `name`.  When you specify a value for `name`, it will also affect the `slug`. The `slug` is reflected in the repository URL of the new fork. It is derived from `name` by substituting non-ASCII characters, removes whitespace, and changes characters to lower case. For example, `My repo` would turn into `my_repo`.  You need contributor access to create new forks within a workspace.   #### Change the properties of a new fork  By default the fork inherits most of its properties from the parent. However, since the optional POST body document follows the normal `repository` JSON schema and you can override the new fork\'s properties.  Properties that can be overridden include:  * description * fork_policy * language * mainbranch * is_private (note that a private repo\'s fork_policy might prohibit   the creation of public forks, in which `is_private=False` would fail) * has_issues (to initialize or disable the new repo\'s issue tracker --   note that the actual contents of the parent repository\'s issue   tracker are not copied during forking) * has_wiki (to initialize or disable the new repo\'s wiki --   note that the actual contents of the parent repository\'s wiki are not   copied during forking) * project (when forking into a private project, the fork\'s `is_private`   must be `true`)  Properties that cannot be modified include:  * scm * parent * full_name

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    Repository
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Repository; //A repository object. This can be left blank. (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugForksPost(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Repository**| A repository object. This can be left blank. | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Repository**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created fork. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugGet**
> Repository repositoriesWorkspaceRepoSlugGet()

Returns the object describing this repository.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugGet(
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

**Repository**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository object. |  -  |
|**403** | If the repository is private and the authenticated user does not have access to it. |  -  |
|**404** | If no repository exists at this location. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksGet**
> PaginatedWebhookSubscriptions repositoriesWorkspaceRepoSlugHooksGet()

Returns a paginated list of webhooks installed on this repository.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksGet(
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

**PaginatedWebhookSubscriptions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The paginated list of installed webhooks. |  -  |
|**403** | If the authenticated user does not have permission to access the webhooks. |  -  |
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksPost**
> WebhookSubscription repositoriesWorkspaceRepoSlugHooksPost()

Creates a new webhook on the specified repository.  Example:  ``` $ curl -X POST -u credentials -H \'Content-Type: application/json\'   https://api.bitbucket.org/2.0/repositories/my-workspace/my-repo-slug/hooks   -d \'     {       \"description\": \"Webhook Description\",       \"url\": \"https://example.com/\",       \"active\": true,       \"secret\": \"this is a really bad secret\",       \"events\": [         \"repo:push\",         \"issue:created\",         \"issue:updated\"       ]     }\' ```  When the `secret` is provided it will be used as the key to generate a HMAC digest value sent in the `X-Hub-Signature` header at delivery time. Passing a `null` or empty `secret` or not passing a `secret` will leave the webhook\'s secret unset. Bitbucket only generates the `X-Hub-Signature` when the webhook\'s secret is set.  Note that this call requires the webhook scope, as well as any scope that applies to the events that the webhook subscribes to. In the example above that means: `webhook`, `repository` and `issue`.  Also note that the `url` must properly resolve and cannot be an internal, non-routed address.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksPost(
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

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | If the webhook was registered successfully. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**403** | If the authenticated user does not have permission to install webhooks on the specified repository. |  -  |
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksUidDelete**
> repositoriesWorkspaceRepoSlugHooksUidDelete()

Deletes the specified webhook subscription from the given repository.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksUidDelete(
    repoSlug,
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
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
|**204** | When the webhook was deleted successfully |  -  |
|**403** | If the authenticated user does not have permission to delete the webhook. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksUidGet**
> WebhookSubscription repositoriesWorkspaceRepoSlugHooksUidGet()

Returns the webhook with the specified id installed on the specified repository.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksUidGet(
    repoSlug,
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The webhook subscription object. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugHooksUidPut**
> WebhookSubscription repositoriesWorkspaceRepoSlugHooksUidPut()

Updates the specified webhook subscription.  The following properties can be mutated:  * `description` * `url` * `secret` * `active` * `events`  The hook\'s secret is used as a key to generate the HMAC hex digest sent in the `X-Hub-Signature` header at delivery time. This signature is only generated when the hook has a secret.  Set the hook\'s secret by passing the new value in the `secret` field. Passing a `null` value in the `secret` field will remove the secret from the hook. The hook\'s secret can be left unchanged by not passing the `secret` field in the request.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let uid: string; //Installed webhook\'s ID (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugHooksUidPut(
    repoSlug,
    uid,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **uid** | [**string**] | Installed webhook\&#39;s ID | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**WebhookSubscription**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The webhook subscription object. |  -  |
|**403** | If the authenticated user does not have permission to update the webhook. |  -  |
|**404** | If the webhook or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugOverrideSettingsGet**
> RepositoryInheritanceState repositoriesWorkspaceRepoSlugOverrideSettingsGet()


### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugOverrideSettingsGet(
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

**RepositoryInheritanceState**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository setting inheritance state |  -  |
|**404** | If no repository exists at this location |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugOverrideSettingsPut**
> repositoriesWorkspaceRepoSlugOverrideSettingsPut()


### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugOverrideSettingsPut(
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

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | The repository setting inheritance state was set and no content returned |  -  |
|**404** | If no repository exists at this location |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGet**
> PaginatedRepositoryGroupPermissions repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGet()

Returns a paginated list of explicit group permissions for the given repository. This endpoint does not support BBQL features.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGet(
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

**PaginatedRepositoryGroupPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginated of explicit group permissions on the repository. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository. |  -  |
|**404** | One or both of the workspace and repository doesn\&#39;t exist for the given identifiers. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugDelete**
> repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugDelete()

Deletes the repository group permission between the requested repository and group, if one exists.  Only users with admin permission for the repository may access this resource.  The only authentication method supported for this endpoint is via app passwords.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let groupSlug: string; //Slug of the requested group. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugDelete(
    groupSlug,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupSlug** | [**string**] | Slug of the requested group. | defaults to undefined|
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
|**204** | Group permission deleted |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository, or the authentication method was not via app password. |  -  |
|**404** | The workspace does not exist, the repository does not exist, or the group does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugGet**
> RepositoryGroupPermission repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugGet()

Returns the group permission for a given group slug and repository  Only users with admin permission for the repository may access this resource.  Permissions can be:  * `admin` * `write` * `read` * `none`

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let groupSlug: string; //Slug of the requested group. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugGet(
    groupSlug,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupSlug** | [**string**] | Slug of the requested group. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**RepositoryGroupPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Group permission for group slug and repository |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository. |  -  |
|**404** | The given user, workspace, and/or repository could not be found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugPut**
> RepositoryGroupPermission repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugPut(body)

Updates the group permission, or grants a new permission if one does not already exist.  Only users with admin permission for the repository may access this resource.  The only authentication method supported for this endpoint is via app passwords.  Permissions can be:  * `admin` * `write` * `read`

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    BitbucketAppsPermissionsSerializersRepoPermissionUpdateSchema
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let groupSlug: string; //Slug of the requested group. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: BitbucketAppsPermissionsSerializersRepoPermissionUpdateSchema; //The permission to grant

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigGroupsGroupSlugPut(
    groupSlug,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **BitbucketAppsPermissionsSerializersRepoPermissionUpdateSchema**| The permission to grant | |
| **groupSlug** | [**string**] | Slug of the requested group. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**RepositoryGroupPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Group permission updated |  -  |
|**400** | No permission value was provided or the value is invalid(not one of read, write, or admin) |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**402** | You have reached your plan\&#39;s user limit and must upgrade before giving access to additional users. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository, or the authentication method was not via app password. |  -  |
|**404** | The workspace does not exist, the repository does not exist, or the group does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigUsersGet**
> PaginatedRepositoryUserPermissions repositoriesWorkspaceRepoSlugPermissionsConfigUsersGet()

Returns a paginated list of explicit user permissions for the given repository. This endpoint does not support BBQL features.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigUsersGet(
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

**PaginatedRepositoryUserPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginated of explicit user permissions on the repository. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository. |  -  |
|**404** | No repository exists for the given repository slug and workspace. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdDelete**
> repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdDelete()

Deletes the repository user permission between the requested repository and user, if one exists.  Only users with admin permission for the repository may access this resource.  The only authentication method for this endpoint is via app passwords.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let selectedUserId: string; //This can either be the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`, OR an Atlassian Account ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdDelete(
    repoSlug,
    selectedUserId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **selectedUserId** | [**string**] | This can either be the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;, OR an Atlassian Account ID.  | defaults to undefined|
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
|**204** | The repository user permission was deleted and no content returned. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository, or the authentication method was not via app password. |  -  |
|**404** | One or more of the workspace, repository, and user doesn\&#39;t exist for the given identifiers. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdGet**
> RepositoryUserPermission repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdGet()

Returns the explicit user permission for a given user and repository.  Only users with admin permission for the repository may access this resource.  Permissions can be:  * `admin` * `write` * `read` * `none`

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let selectedUserId: string; //This can either be the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`, OR an Atlassian Account ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdGet(
    repoSlug,
    selectedUserId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **selectedUserId** | [**string**] | This can either be the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;, OR an Atlassian Account ID.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**RepositoryUserPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Explicit user permission for user and repository |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository. |  -  |
|**404** | One or both of the workspace and repository doesn\&#39;t exist for the given identifiers. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdPut**
> RepositoryUserPermission repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdPut(body)

Updates the explicit user permission for a given user and repository. The selected user must be a member of the workspace, and cannot be the workspace owner. Only users with admin permission for the repository may access this resource.  The only authentication method for this endpoint is via app passwords.  Permissions can be:  * `admin` * `write` * `read`

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    BitbucketAppsPermissionsSerializersRepoPermissionUpdateSchema
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let selectedUserId: string; //This can either be the UUID of the account, surrounded by curly-braces, for example: `{account UUID}`, OR an Atlassian Account ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: BitbucketAppsPermissionsSerializersRepoPermissionUpdateSchema; //The permission to grant

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPermissionsConfigUsersSelectedUserIdPut(
    repoSlug,
    selectedUserId,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **BitbucketAppsPermissionsSerializersRepoPermissionUpdateSchema**| The permission to grant | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **selectedUserId** | [**string**] | This can either be the UUID of the account, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;, OR an Atlassian Account ID.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**RepositoryUserPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Explicit user permission updated |  -  |
|**400** | No permission value was provided or the value is invalid (not one of read, write, or admin), or the selected user is not a valid user to update. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**402** | You have reached your plan\&#39;s user limit and must upgrade before giving access to additional users. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the repository, or the authentication method was not via app password. |  -  |
|**404** | One or more of the workspace, repository, and selected user doesn\&#39;t exist for the given identifiers. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPost**
> Repository repositoriesWorkspaceRepoSlugPost()

Creates a new repository.  Note: In order to set the project for the newly created repository, pass in either the project key or the project UUID as part of the request body as shown in the examples below:  ``` $ curl -X POST -H \"Content-Type: application/json\" -d \'{     \"scm\": \"git\",     \"project\": {         \"key\": \"MARS\"     } }\' https://api.bitbucket.org/2.0/repositories/teamsinspace/hablanding ```  or  ``` $ curl -X POST -H \"Content-Type: application/json\" -d \'{     \"scm\": \"git\",     \"project\": {         \"key\": \"{ba516952-992a-4c2d-acbd-17d502922f96}\"     } }\' https://api.bitbucket.org/2.0/repositories/teamsinspace/hablanding ```  The project must be assigned for all repositories. If the project is not provided, the repository is automatically assigned to the oldest project in the workspace.  Note: In the examples above, the workspace ID `teamsinspace`, and/or the repository name `hablanding` can be replaced by UUIDs.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    Repository
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Repository; //The repository that is to be created. Note that most object elements are optional. Elements \"owner\" and \"full_name\" are ignored as the URL implies them. (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPost(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Repository**| The repository that is to be created. Note that most object elements are optional. Elements \&quot;owner\&quot; and \&quot;full_name\&quot; are ignored as the URL implies them. | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Repository**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The newly created repository. |  -  |
|**400** | If the input document was invalid, or if the caller lacks the privilege to create repositories under the targeted account. |  -  |
|**401** | If the request was not authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPut**
> Repository repositoriesWorkspaceRepoSlugPut()

Since this endpoint can be used to both update and to create a repository, the request body depends on the intent.  #### Creation  See the POST documentation for the repository endpoint for an example of the request body.  #### Update  Note: Changing the `name` of the repository will cause the location to be changed. This is because the URL of the repo is derived from the name (a process called slugification). In such a scenario, it is possible for the request to fail if the newly created slug conflicts with an existing repository\'s slug. But if there is no conflict, the new location will be returned in the `Location` header of the response.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration,
    Repository
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Repository; //The repository that is to be updated.  Note that the elements \"owner\" and \"full_name\" are ignored since the URL implies them.  (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPut(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Repository**| The repository that is to be updated.  Note that the elements \&quot;owner\&quot; and \&quot;full_name\&quot; are ignored since the URL implies them.  | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Repository**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The existing repository has been updated |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**201** | A new repository has been created |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | If the input document was invalid, or if the caller lacks the privilege to create repositories under the targeted account. |  -  |
|**401** | If the request was not authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugSrcCommitPathGet**
> PaginatedTreeentries repositoriesWorkspaceRepoSlugSrcCommitPathGet()

This endpoints is used to retrieve the contents of a single file, or the contents of a directory at a specified revision.  #### Raw file contents  When `path` points to a file, this endpoint returns the raw contents. The response\'s Content-Type is derived from the filename extension (not from the contents). The file contents are not processed and no character encoding/recoding is performed and as a result no character encoding is included as part of the Content-Type.  The `Content-Disposition` header will be \"attachment\" to prevent browsers from running executable files.  If the file is managed by LFS, then a 301 redirect pointing to Atlassian\'s media services platform is returned.  The response includes an ETag that is based on the contents of the file and its attributes. This means that an empty `__init__.py` always returns the same ETag, regardless on the directory it lives in, or the commit it is on.  #### File meta data  When the request for a file path includes the query parameter `?format=meta`, instead of returning the file\'s raw contents, Bitbucket instead returns the JSON object describing the file\'s properties:  ```javascript $ curl https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef/tests/__init__.py?format=meta {   \"links\": {     \"self\": {       \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/__init__.py\"     },     \"meta\": {       \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/__init__.py?format=meta\"     }   },   \"path\": \"tests/__init__.py\",   \"commit\": {     \"type\": \"commit\",     \"hash\": \"eefd5ef5d3df01aed629f650959d6706d54cd335\",     \"links\": {       \"self\": {         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/commit/eefd5ef5d3df01aed629f650959d6706d54cd335\"       },       \"html\": {         \"href\": \"https://bitbucket.org/atlassian/bbql/commits/eefd5ef5d3df01aed629f650959d6706d54cd335\"       }     }   },   \"attributes\": [],   \"type\": \"commit_file\",   \"size\": 0 } ```  File objects contain an `attributes` element that contains a list of possible modifiers. Currently defined values are:  * `link` -- indicates that the entry is a symbolic link. The contents     of the file represent the path the link points to. * `executable` -- indicates that the file has the executable bit set. * `subrepository` -- indicates that the entry points to a submodule or     subrepo. The contents of the file is the SHA1 of the repository     pointed to. * `binary` -- indicates whether Bitbucket thinks the file is binary.  This endpoint can provide an alternative to how a HEAD request can be used to check for the existence of a file, or a file\'s size without incurring the overhead of receiving its full contents.   #### Directory listings  When `path` points to a directory instead of a file, the response is a paginated list of directory and file objects in the same order as the underlying SCM system would return them.  For example:  ```javascript $ curl https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef/tests {   \"pagelen\": 10,   \"values\": [     {       \"path\": \"tests/test_project\",       \"type\": \"commit_directory\",       \"links\": {         \"self\": {           \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/test_project/\"         },         \"meta\": {           \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/test_project/?format=meta\"         }       },       \"commit\": {         \"type\": \"commit\",         \"hash\": \"eefd5ef5d3df01aed629f650959d6706d54cd335\",         \"links\": {           \"self\": {             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/commit/eefd5ef5d3df01aed629f650959d6706d54cd335\"           },           \"html\": {             \"href\": \"https://bitbucket.org/atlassian/bbql/commits/eefd5ef5d3df01aed629f650959d6706d54cd335\"           }         }       }     },     {       \"links\": {         \"self\": {           \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/__init__.py\"         },         \"meta\": {           \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/__init__.py?format=meta\"         }       },       \"path\": \"tests/__init__.py\",       \"commit\": {         \"type\": \"commit\",         \"hash\": \"eefd5ef5d3df01aed629f650959d6706d54cd335\",         \"links\": {           \"self\": {             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/commit/eefd5ef5d3df01aed629f650959d6706d54cd335\"           },           \"html\": {             \"href\": \"https://bitbucket.org/atlassian/bbql/commits/eefd5ef5d3df01aed629f650959d6706d54cd335\"           }         }       },       \"attributes\": [],       \"type\": \"commit_file\",       \"size\": 0     }   ],   \"page\": 1,   \"size\": 2 } ```  When listing the contents of the repo\'s root directory, the use of a trailing slash at the end of the URL is required.  The response by default is not recursive, meaning that only the direct contents of a path are returned. The response does not recurse down into subdirectories. In order to \"walk\" the entire directory tree, the client can either parse each response and follow the `self` links of each `commit_directory` object, or can specify a `max_depth` to recurse to.  The max_depth parameter will do a breadth-first search to return the contents of the subdirectories up to the depth specified. Breadth-first search was chosen as it leads to the least amount of file system operations for git. If the `max_depth` parameter is specified to be too large, the call will time out and return a 555.  Each returned object is either a `commit_file`, or a `commit_directory`, both of which contain a `path` element. This path is the absolute path from the root of the repository. Each object also contains a `commit` object which embeds the commit the file is on. Note that this is merely the commit that was used in the URL. It is *not* the commit that last modified the file.  Directory objects have 2 representations. Their `self` link returns the paginated contents of the directory. The `meta` link on the other hand returns the actual `directory` object itself, e.g.:  ```javascript {   \"path\": \"tests/test_project\",   \"type\": \"commit_directory\",   \"links\": {     \"self\": {       \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/test_project/\"     },     \"meta\": {       \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src/eefd5ef5d3df01aed629f650959d6706d54cd335/tests/test_project/?format=meta\"     }   },   \"commit\": { ... } } ```  #### Querying, filtering and sorting  Like most API endpoints, this API supports the Bitbucket querying/filtering syntax and so you could filter a directory listing to only include entries that match certain criteria. For instance, to list all binary files over 1kb use the expression:  `size > 1024 and attributes = \"binary\"`  which after urlencoding yields the query string:  `?q=size%3E1024+and+attributes%3D%22binary%22`  To change the ordering of the response, use the `?sort` parameter:  `.../src/eefd5ef/?sort=-size`  See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let path: string; //Path to the file. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let format: 'meta' | 'rendered'; //If \'meta\' is provided, returns the (json) meta data for the contents of the file.  If \'rendered\' is provided, returns the contents of a non-binary file in HTML-formatted rendered markup. The \'rendered\' option only supports these filetypes: `.md`, `.markdown`, `.mkd`, `.mkdn`, `.mdown`, `.text`, `.rst`, and `.textile`. Since Git does not generally track what text encoding scheme is used, this endpoint attempts to detect the most appropriate character encoding. While usually correct, determining the character encoding can be ambiguous which in exceptional cases can lead to misinterpretation of the characters. As such, the raw element in the response object should not be treated as equivalent to the file\'s actual contents. (optional) (default to undefined)
let q: string; //Optional filter expression as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)
let sort: string; //Optional sorting parameter as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results). (optional) (default to undefined)
let maxDepth: number; //If provided, returns the contents of the repository and its subdirectories recursively until the specified max_depth of nested directories. When omitted, this defaults to 1. (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugSrcCommitPathGet(
    commit,
    path,
    repoSlug,
    workspace,
    format,
    q,
    sort,
    maxDepth
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **path** | [**string**] | Path to the file. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **format** | [**&#39;meta&#39; | &#39;rendered&#39;**]**Array<&#39;meta&#39; &#124; &#39;rendered&#39;>** | If \&#39;meta\&#39; is provided, returns the (json) meta data for the contents of the file.  If \&#39;rendered\&#39; is provided, returns the contents of a non-binary file in HTML-formatted rendered markup. The \&#39;rendered\&#39; option only supports these filetypes: &#x60;.md&#x60;, &#x60;.markdown&#x60;, &#x60;.mkd&#x60;, &#x60;.mkdn&#x60;, &#x60;.mdown&#x60;, &#x60;.text&#x60;, &#x60;.rst&#x60;, and &#x60;.textile&#x60;. Since Git does not generally track what text encoding scheme is used, this endpoint attempts to detect the most appropriate character encoding. While usually correct, determining the character encoding can be ambiguous which in exceptional cases can lead to misinterpretation of the characters. As such, the raw element in the response object should not be treated as equivalent to the file\&#39;s actual contents. | (optional) defaults to undefined|
| **q** | [**string**] | Optional filter expression as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|
| **sort** | [**string**] | Optional sorting parameter as per [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results). | (optional) defaults to undefined|
| **maxDepth** | [**number**] | If provided, returns the contents of the repository and its subdirectories recursively until the specified max_depth of nested directories. When omitted, this defaults to 1. | (optional) defaults to undefined|


### Return type

**PaginatedTreeentries**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | If the path matches a file, then the raw contents of the file are returned.  If the &#x60;format&#x3D;meta&#x60; query parameter is provided, a json document containing the file\&#39;s meta data is returned.  If the &#x60;format&#x3D;rendered&#x60; query parameter is provided, the contents of the file in HTML-formated rendered markup is returned. If the path matches a directory, then a paginated list of file and directory entries is returned (if the &#x60;format&#x3D;meta&#x60; query parameter was provided, then the json document containing the directory\&#39;s meta data is returned.)  |  -  |
|**404** | If the path or commit in the URL does not exist. |  -  |
|**555** | If the call times out, possibly because the specified recursion depth is too large. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugSrcGet**
> PaginatedTreeentries repositoriesWorkspaceRepoSlugSrcGet()

This endpoint redirects the client to the directory listing of the root directory on the main branch.  This is equivalent to directly hitting [/2.0/repositories/{username}/{repo_slug}/src/{commit}/{path}](src/%7Bcommit%7D/%7Bpath%7D) without having to know the name or SHA1 of the repo\'s main branch.  To create new commits, [POST to this endpoint](#post)

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let format: 'meta'; //Instead of returning the file\'s contents, return the (json) meta data for it. (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugSrcGet(
    repoSlug,
    workspace,
    format
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **format** | [**&#39;meta&#39;**]**Array<&#39;meta&#39;>** | Instead of returning the file\&#39;s contents, return the (json) meta data for it. | (optional) defaults to undefined|


### Return type

**PaginatedTreeentries**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | If the path matches a file, then the raw contents of the file are returned (unless the &#x60;format&#x3D;meta&#x60; query parameter was provided, in which case a json document containing the file\&#39;s meta data is returned). If the path matches a directory, then a paginated list of file and directory entries is returned (if the &#x60;format&#x3D;meta&#x60; query parameter was provided, then the json document containing the directory\&#39;s meta data is returned).  |  -  |
|**404** | If the path or commit in the URL does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugSrcPost**
> repositoriesWorkspaceRepoSlugSrcPost()

This endpoint is used to create new commits in the repository by uploading files.  To add a new file to a repository:  ``` $ curl https://api.bitbucket.org/2.0/repositories/username/slug/src \\   -F /repo/path/to/image.png=@image.png ```  This will create a new commit on top of the main branch, inheriting the contents of the main branch, but adding (or overwriting) the `image.png` file to the repository in the `/repo/path/to` directory.  To create a commit that deletes files, use the `files` parameter:  ``` $ curl https://api.bitbucket.org/2.0/repositories/username/slug/src \\   -F files=/file/to/delete/1.txt \\   -F files=/file/to/delete/2.txt ```  You can add/modify/delete multiple files in a request. Rename/move a file by deleting the old path and adding the content at the new path.  This endpoint accepts `multipart/form-data` (as in the examples above), as well as `application/x-www-form-urlencoded`.  Note: `multipart/form-data` is currently not supported by Forge apps for this API.  #### multipart/form-data  A `multipart/form-data` post contains a series of \"form fields\" that identify both the individual files that are being uploaded, as well as additional, optional meta data.  Files are uploaded in file form fields (those that have a `Content-Disposition` parameter) whose field names point to the remote path in the repository where the file should be stored. Path field names are always interpreted to be absolute from the root of the repository, regardless whether the client uses a leading slash (as the above `curl` example did).  File contents are treated as bytes and are not decoded as text.  The commit message, as well as other non-file meta data for the request, is sent along as normal form field elements. Meta data fields share the same namespace as the file objects. For `multipart/form-data` bodies that should not lead to any ambiguity, as the `Content-Disposition` header will contain the `filename` parameter to distinguish between a file named \"message\" and the commit message field.  #### application/x-www-form-urlencoded  It is also possible to upload new files using a simple `application/x-www-form-urlencoded` POST. This can be convenient when uploading pure text files:  ``` $ curl https://api.bitbucket.org/2.0/repositories/atlassian/bbql/src \\   --data-urlencode \"/path/to/me.txt=Lorem ipsum.\" \\   --data-urlencode \"message=Initial commit\" \\   --data-urlencode \"author=Erik van Zijst <erik.van.zijst@gmail.com>\" ```  There could be a field name clash if a client were to upload a file named \"message\", as this filename clashes with the meta data property for the commit message. To avoid this and to upload files whose names clash with the meta data properties, use a leading slash for the files, e.g. `curl --data-urlencode \"/message=file contents\"`.  When an explicit slash is omitted for a file whose path matches that of a meta data parameter, then it is interpreted as meta data, not as a file.  #### Executables and links  While this API aims to facilitate the most common use cases, it is possible to perform some more advanced operations like creating a new symlink in the repository, or creating an executable file.  Files can be supplied with a `x-attributes` value in the `Content-Disposition` header. For example, to upload an executable file, as well as create a symlink from `README.txt` to `README`:  ``` --===============1438169132528273974== Content-Type: text/plain; charset=\"us-ascii\" MIME-Version: 1.0 Content-Transfer-Encoding: 7bit Content-ID: \"bin/shutdown.sh\" Content-Disposition: attachment; filename=\"shutdown.sh\"; x-attributes:\"executable\"  #!/bin/sh halt  --===============1438169132528273974== Content-Type: text/plain; charset=\"us-ascii\" MIME-Version: 1.0 Content-Transfer-Encoding: 7bit Content-ID: \"/README.txt\" Content-Disposition: attachment; filename=\"README.txt\"; x-attributes:\"link\"  README --===============1438169132528273974==-- ```  Links are files that contain the target path and have `x-attributes:\"link\"` set.  When overwriting links with files, or vice versa, the newly uploaded file determines both the new contents, as well as the attributes. That means uploading a file without specifying `x-attributes=\"link\"` will create a regular file, even if the parent commit hosted a symlink at the same path.  The same applies to executables. When modifying an existing executable file, the form-data file element must include `x-attributes=\"executable\"` in order to preserve the executable status of the file.  Note that this API does not support the creation or manipulation of subrepos / submodules.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let message: string; //The commit message. When omitted, Bitbucket uses a canned string. (optional) (default to undefined)
let author: string; // The raw string to be used as the new commit\'s author. This string follows the format `Erik van Zijst <evzijst@atlassian.com>`.  When omitted, Bitbucket uses the authenticated user\'s full/display name and primary email address. Commits cannot be created anonymously. (optional) (default to undefined)
let parents: string; // #### Deprecation Notice: Support for specifying multiple parent commits is deprecated and will be removed in a future release. Only a single SHA1 is accepted.  A SHA1 of the commit that should be the parent of the newly created commit. When omitted, the new commit will inherit from and become a child of the main branch\'s tip/HEAD commit. (optional) (default to undefined)
let files: string; // Optional field that declares the files that the request is manipulating. When adding a new file to a repo, or when overwriting an existing file, the client can just upload the full contents of the file in a normal form field and the use of this `files` meta data field is redundant. However, when the `files` field contains a file path that does not have a corresponding, identically-named form field, then Bitbucket interprets that as the client wanting to replace the named file with the null set and the file is deleted instead.  Paths in the repo that are referenced in neither files nor an individual file field, remain unchanged and carry over from the parent to the new commit.  This API does not support renaming as an explicit feature. To rename a file, simply delete it and recreate it under the new name in the same commit.  (optional) (default to undefined)
let branch: string; // The name of the branch that the new commit should be created on. When omitted, the commit will be created on top of the main branch and will become the main branch\'s new head.  When a branch name is provided that already exists in the repo, then the commit will be created on top of that branch. In this case, *if* a parent SHA1 was also provided, then it is asserted that the parent is the branch\'s tip/HEAD at the time the request is made. When this is not the case, a 409 is returned.  When a new branch name is specified (that does not already exist in the repo), and no parent SHA1s are provided, then the new commit will inherit from the current main branch\'s tip/HEAD commit, but not advance the main branch. The new commit will be the new branch. When the request *also* specifies a parent SHA1, then the new commit and branch are created directly on top of the parent commit, regardless of the state of the main branch.  When a branch name is not specified, but a parent SHA1 is provided, then Bitbucket asserts that it represents the main branch\'s current HEAD/tip, or a 409 is returned.  When a branch name is not specified and the repo is empty, the new commit will become the repo\'s root commit and will be on the main branch.  When a branch name is specified and the repo is empty, the new commit will become the repo\'s root commit and also define the repo\'s main branch going forward.  This API cannot be used to create additional root commits in non-empty repos.  The branch field cannot be repeated.  As a side effect, this API can be used to create a new branch without modifying any files, by specifying a new branch name in this field, together with `parents`, but omitting the `files` fields, while not sending any files. This will create a new commit and branch with the same contents as the first parent. The diff of this commit against its first parent will be empty.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugSrcPost(
    repoSlug,
    workspace,
    message,
    author,
    parents,
    files,
    branch
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **message** | [**string**] | The commit message. When omitted, Bitbucket uses a canned string. | (optional) defaults to undefined|
| **author** | [**string**] |  The raw string to be used as the new commit\&#39;s author. This string follows the format &#x60;Erik van Zijst &lt;evzijst@atlassian.com&gt;&#x60;.  When omitted, Bitbucket uses the authenticated user\&#39;s full/display name and primary email address. Commits cannot be created anonymously. | (optional) defaults to undefined|
| **parents** | [**string**] |  #### Deprecation Notice: Support for specifying multiple parent commits is deprecated and will be removed in a future release. Only a single SHA1 is accepted.  A SHA1 of the commit that should be the parent of the newly created commit. When omitted, the new commit will inherit from and become a child of the main branch\&#39;s tip/HEAD commit. | (optional) defaults to undefined|
| **files** | [**string**] |  Optional field that declares the files that the request is manipulating. When adding a new file to a repo, or when overwriting an existing file, the client can just upload the full contents of the file in a normal form field and the use of this &#x60;files&#x60; meta data field is redundant. However, when the &#x60;files&#x60; field contains a file path that does not have a corresponding, identically-named form field, then Bitbucket interprets that as the client wanting to replace the named file with the null set and the file is deleted instead.  Paths in the repo that are referenced in neither files nor an individual file field, remain unchanged and carry over from the parent to the new commit.  This API does not support renaming as an explicit feature. To rename a file, simply delete it and recreate it under the new name in the same commit.  | (optional) defaults to undefined|
| **branch** | [**string**] |  The name of the branch that the new commit should be created on. When omitted, the commit will be created on top of the main branch and will become the main branch\&#39;s new head.  When a branch name is provided that already exists in the repo, then the commit will be created on top of that branch. In this case, *if* a parent SHA1 was also provided, then it is asserted that the parent is the branch\&#39;s tip/HEAD at the time the request is made. When this is not the case, a 409 is returned.  When a new branch name is specified (that does not already exist in the repo), and no parent SHA1s are provided, then the new commit will inherit from the current main branch\&#39;s tip/HEAD commit, but not advance the main branch. The new commit will be the new branch. When the request *also* specifies a parent SHA1, then the new commit and branch are created directly on top of the parent commit, regardless of the state of the main branch.  When a branch name is not specified, but a parent SHA1 is provided, then Bitbucket asserts that it represents the main branch\&#39;s current HEAD/tip, or a 409 is returned.  When a branch name is not specified and the repo is empty, the new commit will become the repo\&#39;s root commit and will be on the main branch.  When a branch name is specified and the repo is empty, the new commit will become the repo\&#39;s root commit and also define the repo\&#39;s main branch going forward.  This API cannot be used to create additional root commits in non-empty repos.  The branch field cannot be repeated.  As a side effect, this API can be used to create a new branch without modifying any files, by specifying a new branch name in this field, together with &#x60;parents&#x60;, but omitting the &#x60;files&#x60; fields, while not sending any files. This will create a new commit and branch with the same contents as the first parent. The diff of this commit against its first parent will be empty.  | (optional) defaults to undefined|


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
|**201** |   |  -  |
|**403** | If the authenticated user does not have write or admin access |  -  |
|**404** | If the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugWatchersGet**
> PaginatedAccounts repositoriesWorkspaceRepoSlugWatchersGet()

Returns a paginated list of all the watchers on the specified repository.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugWatchersGet(
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

**PaginatedAccounts**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of all the watchers on the specified repository. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **userPermissionsRepositoriesGet**
> PaginatedRepositoryPermissions userPermissionsRepositoriesGet()

**This endpoint is deprecated. Please use the [workspace scoped alternative](/cloud/bitbucket/rest/api-group-repositories/#api-user-workspaces-workspace-permissions-repositories-get).**  Returns an object for each repository the caller has explicit access to and their effective permission — the highest level of permission the caller has. This does not return public repositories that the user was not granted any specific permission in, and does not distinguish between explicit and implicit privileges.  Permissions can be:  * `admin` * `write` * `read`  Results may be further [filtered or sorted](/cloud/bitbucket/rest/intro/#filtering) by repository or permission by adding the following query string parameters:  * `q=repository.name=\"geordi\"` or `q=permission>\"read\"` * `sort=repository.name`  Note that the query parameter values need to be URL escaped so that `=` would become `%3D`.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)
let sort: string; // Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)

const { status, data } = await apiInstance.userPermissionsRepositoriesGet(
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|


### Return type

**PaginatedRepositoryPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Repository permissions for the repositories a caller has explicit access to. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **userWorkspacesWorkspacePermissionsRepositoriesGet**
> PaginatedRepositoryPermissions userWorkspacesWorkspacePermissionsRepositoriesGet()

Returns an object for each repository the caller has explicit access to in the specified workspace and their effective permission — the highest level of permission the caller has. This does not return public repositories that the user was not granted any specific permission in, and does not distinguish between explicit and implicit privileges.  Permissions can be:  * `admin` * `write` * `read`  Results may be further [filtered or sorted](/cloud/bitbucket/rest/intro/#filtering) by repository or permission by adding the following query string parameters:  * `q=repository.name=\"bits\"` or `q=permission>\"read\"` * `sort=repository.name`  Note that the query parameter values need to be URL escaped so that `=` would become `%3D`.

### Example

```typescript
import {
    RepositoriesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RepositoriesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)
let sort: string; // Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)

const { status, data } = await apiInstance.userWorkspacesWorkspacePermissionsRepositoriesGet(
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property sort the result by as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|


### Return type

**PaginatedRepositoryPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of repository permissions for the authenticated user in the specified workspace. |  -  |
|**400** | The request was invalid. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**403** | The requesting user does not have access to the workspace. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

