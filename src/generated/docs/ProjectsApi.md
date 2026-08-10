# ProjectsApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**workspacesWorkspaceProjectsPost**](#workspacesworkspaceprojectspost) | **POST** /workspaces/{workspace}/projects | Create a project in a workspace|
|[**workspacesWorkspaceProjectsProjectKeyDefaultReviewersGet**](#workspacesworkspaceprojectsprojectkeydefaultreviewersget) | **GET** /workspaces/{workspace}/projects/{project_key}/default-reviewers | List the default reviewers in a project|
|[**workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserDelete**](#workspacesworkspaceprojectsprojectkeydefaultreviewersselecteduserdelete) | **DELETE** /workspaces/{workspace}/projects/{project_key}/default-reviewers/{selected_user} | Remove the specific user from the project\&#39;s default reviewers|
|[**workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserGet**](#workspacesworkspaceprojectsprojectkeydefaultreviewersselecteduserget) | **GET** /workspaces/{workspace}/projects/{project_key}/default-reviewers/{selected_user} | Get a default reviewer|
|[**workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserPut**](#workspacesworkspaceprojectsprojectkeydefaultreviewersselecteduserput) | **PUT** /workspaces/{workspace}/projects/{project_key}/default-reviewers/{selected_user} | Add the specific user as a default reviewer for the project|
|[**workspacesWorkspaceProjectsProjectKeyDelete**](#workspacesworkspaceprojectsprojectkeydelete) | **DELETE** /workspaces/{workspace}/projects/{project_key} | Delete a project for a workspace|
|[**workspacesWorkspaceProjectsProjectKeyGet**](#workspacesworkspaceprojectsprojectkeyget) | **GET** /workspaces/{workspace}/projects/{project_key} | Get a project for a workspace|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGet**](#workspacesworkspaceprojectsprojectkeypermissionsconfiggroupsget) | **GET** /workspaces/{workspace}/projects/{project_key}/permissions-config/groups | List explicit group permissions for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugDelete**](#workspacesworkspaceprojectsprojectkeypermissionsconfiggroupsgroupslugdelete) | **DELETE** /workspaces/{workspace}/projects/{project_key}/permissions-config/groups/{group_slug} | Delete an explicit group permission for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugGet**](#workspacesworkspaceprojectsprojectkeypermissionsconfiggroupsgroupslugget) | **GET** /workspaces/{workspace}/projects/{project_key}/permissions-config/groups/{group_slug} | Get an explicit group permission for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugPut**](#workspacesworkspaceprojectsprojectkeypermissionsconfiggroupsgroupslugput) | **PUT** /workspaces/{workspace}/projects/{project_key}/permissions-config/groups/{group_slug} | Update an explicit group permission for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersGet**](#workspacesworkspaceprojectsprojectkeypermissionsconfigusersget) | **GET** /workspaces/{workspace}/projects/{project_key}/permissions-config/users | List explicit user permissions for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdDelete**](#workspacesworkspaceprojectsprojectkeypermissionsconfigusersselecteduseriddelete) | **DELETE** /workspaces/{workspace}/projects/{project_key}/permissions-config/users/{selected_user_id} | Delete an explicit user permission for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdGet**](#workspacesworkspaceprojectsprojectkeypermissionsconfigusersselecteduseridget) | **GET** /workspaces/{workspace}/projects/{project_key}/permissions-config/users/{selected_user_id} | Get an explicit user permission for a project|
|[**workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdPut**](#workspacesworkspaceprojectsprojectkeypermissionsconfigusersselecteduseridput) | **PUT** /workspaces/{workspace}/projects/{project_key}/permissions-config/users/{selected_user_id} | Update an explicit user permission for a project|
|[**workspacesWorkspaceProjectsProjectKeyPut**](#workspacesworkspaceprojectsprojectkeyput) | **PUT** /workspaces/{workspace}/projects/{project_key} | Update a project for a workspace|

# **workspacesWorkspaceProjectsPost**
> Project workspacesWorkspaceProjectsPost(body)

Creates a new project.  Note that the avatar has to be embedded as either a data-url or a URL to an external image as shown in the examples below:  ``` $ body=$(cat << EOF {     \"name\": \"Mars Project\",     \"key\": \"MARS\",     \"description\": \"Software for colonizing mars.\",     \"links\": {         \"avatar\": {             \"href\": \"data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/...\"         }     },     \"is_private\": false } EOF ) $ curl -H \"Content-Type: application/json\" \\        -X POST \\        -d \"$body\" \\        https://api.bitbucket.org/2.0/workspaces/teams-in-space/projects/ | jq . {   // Serialized project document } ```  or even:  ``` $ body=$(cat << EOF {     \"name\": \"Mars Project\",     \"key\": \"MARS\",     \"description\": \"Software for colonizing mars.\",     \"links\": {         \"avatar\": {             \"href\": \"http://i.imgur.com/72tRx4w.gif\"         }     },     \"is_private\": false } EOF ) $ curl -H \"Content-Type: application/json\" \\        -X POST \\        -d \"$body\" \\        https://api.bitbucket.org/2.0/workspaces/teams-in-space/projects/ | jq . {   // Serialized project document } ```

### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    Project
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Project; //

const { status, data } = await apiInstance.workspacesWorkspaceProjectsPost(
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Project**|  | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Project**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | A new project has been created. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**403** | The user requesting to create a project does not have the necessary permissions. |  -  |
|**404** | A workspace doesn\&#39;t exist at this location. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDefaultReviewersGet**
> PaginatedDefaultReviewerAndType workspacesWorkspaceProjectsProjectKeyDefaultReviewersGet()

Return a list of all default reviewers for a project. This is a list of users that will be added as default reviewers to pull requests for any repository within the project.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDefaultReviewersGet(
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

**PaginatedDefaultReviewerAndType**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of project default reviewers |  -  |
|**403** | If the authenticated user does not have admin access to the project |  -  |
|**404** | If the workspace or project does not exist at this location |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserDelete**
> workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserDelete()

Removes a default reviewer from the project.  Example: ``` $ curl https://api.bitbucket.org/2.0/.../default-reviewers/%7Bf0e0e8e9-66c1-4b85-a784-44a9eb9ef1a6%7D  HTTP/1.1 204 ```

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This can either be the actual `key` assigned to the project or the `UUID` (surrounded by curly-braces (`{}`)).  (default to undefined)
let selectedUser: string; //This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserDelete(
    projectKey,
    selectedUser,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This can either be the actual &#x60;key&#x60; assigned to the project or the &#x60;UUID&#x60; (surrounded by curly-braces (&#x60;{}&#x60;)).  | defaults to undefined|
| **selectedUser** | [**string**] | This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
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
|**204** | The specified user was removed from the list of project default reviewers |  -  |
|**400** | If the specified user is not a default reviewer for the project |  -  |
|**403** | If the authenticated user does not have admin access to the project |  -  |
|**404** | If the specified user, project, or workspace does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserGet**
> User workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserGet()

Returns the specified default reviewer.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This can either be the actual `key` assigned to the project or the `UUID` (surrounded by curly-braces (`{}`)).  (default to undefined)
let selectedUser: string; //This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserGet(
    projectKey,
    selectedUser,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This can either be the actual &#x60;key&#x60; assigned to the project or the &#x60;UUID&#x60; (surrounded by curly-braces (&#x60;{}&#x60;)).  | defaults to undefined|
| **selectedUser** | [**string**] | This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**User**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified user that is a default reviewer |  -  |
|**400** | If the specified user is not a default reviewer for the project |  -  |
|**403** | If the authenticated user does not have admin access to the project |  -  |
|**404** | If the specified user, project, or workspace does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserPut**
> User workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserPut()

Adds the specified user to the project\'s list of default reviewers. The method is idempotent. Accepts an optional body containing the `uuid` of the user to be added.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This can either be the actual `key` assigned to the project or the `UUID` (surrounded by curly-braces (`{}`)).  (default to undefined)
let selectedUser: string; //This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDefaultReviewersSelectedUserPut(
    projectKey,
    selectedUser,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This can either be the actual &#x60;key&#x60; assigned to the project or the &#x60;UUID&#x60; (surrounded by curly-braces (&#x60;{}&#x60;)).  | defaults to undefined|
| **selectedUser** | [**string**] | This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**User**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified user was added as a project default reviewer |  -  |
|**400** | If the specified user cannot be added as a default reviewer for the project |  -  |
|**403** | If the authenticated user does not have admin access to the project |  -  |
|**404** | If the specified user, project, or workspace does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDelete**
> workspacesWorkspaceProjectsProjectKeyDelete()

Deletes this project. This is an irreversible operation.  You cannot delete a project that still contains repositories. To delete the project, [delete](/cloud/bitbucket/rest/api-group-repositories/#api-repositories-workspace-repo-slug-delete) or transfer the repositories first.  Example: ``` $ curl -X DELETE https://api.bitbucket.org/2.0/workspaces/bbworkspace1/projects/PROJ ```

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDelete(
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

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Successful deletion. |  -  |
|**403** | The requesting user isn\&#39;t authorized to delete the project or the project isn\&#39;t empty. |  -  |
|**404** | A project isn\&#39;t hosted at this location. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyGet**
> Project workspacesWorkspaceProjectsProjectKeyGet()

Returns the requested project.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyGet(
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

**Project**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The project that is part of a workspace. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**403** | The requesting user isn\&#39;t authorized to access the project. |  -  |
|**404** | A project isn\&#39;t hosted at this location. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGet**
> PaginatedProjectGroupPermissions workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGet()

Returns a paginated list of explicit group permissions for the given project. This endpoint does not support BBQL features.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGet(
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedProjectGroupPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginated list of project group permissions |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The user doesn\&#39;t have admin access to the project. |  -  |
|**404** | One or both of the workspace and project don\&#39;t exist for the given identifiers or the requesting user is not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugDelete**
> workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugDelete()

Deletes the project group permission between the requested project and group, if one exists.  Only users with admin permission for the project may access this resource.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let groupSlug: string; //Slug of the requested group. (default to undefined)
let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugDelete(
    groupSlug,
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupSlug** | [**string**] | Slug of the requested group. | defaults to undefined|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
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
|**204** | The project group permission was deleted and no content returned. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the project, or the authentication method was not via app password. |  -  |
|**404** | One or more of the workspace, project, and group doesn\&#39;t exist                               for the given identifiers or the requesting user is not                               authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugGet**
> ProjectGroupPermission workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugGet()

Returns the group permission for a given group and project.  Only users with admin permission for the project may access this resource.  Permissions can be:  * `admin` * `create-repo` * `write` * `read` * `none`

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let groupSlug: string; //Slug of the requested group. (default to undefined)
let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugGet(
    groupSlug,
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **groupSlug** | [**string**] | Slug of the requested group. | defaults to undefined|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ProjectGroupPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Project group permission |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The user doesn\&#39;t have admin access to the project. |  -  |
|**404** | One or more of the workspace, project, and group doesn\&#39;t exist                               for the given identifiers or the requesting user is not                               authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugPut**
> ProjectGroupPermission workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugPut(body)

Updates the group permission, or grants a new permission if one does not already exist.  Only users with admin permission for the project may access this resource.  Due to security concerns, the JWT and OAuth authentication methods are unsupported. This is to ensure integrations and add-ons are not allowed to change permissions.  Permissions can be:  * `admin` * `create-repo` * `write` * `read`

### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    BitbucketAppsPermissionsSerializersProjectPermissionUpdateSchema
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let groupSlug: string; //Slug of the requested group. (default to undefined)
let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: BitbucketAppsPermissionsSerializersProjectPermissionUpdateSchema; //The permission to grant

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigGroupsGroupSlugPut(
    groupSlug,
    projectKey,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **BitbucketAppsPermissionsSerializersProjectPermissionUpdateSchema**| The permission to grant | |
| **groupSlug** | [**string**] | Slug of the requested group. | defaults to undefined|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ProjectGroupPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Project group permission updated. |  -  |
|**400** | No permission value was provided or the value is invalid(not one of read, write, create-repo, or admin). |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**402** | You have reached your plan\&#39;s user limit and must upgrade before giving access to additional users. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the project, or the authentication method was not via app password. |  -  |
|**404** | One or more of the workspace, project, and group doesn\&#39;t exist                               for the given identifiers or the requesting user is not                               authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersGet**
> PaginatedProjectUserPermissions workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersGet()

Returns a paginated list of explicit user permissions for the given project. This endpoint does not support BBQL features.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersGet(
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedProjectUserPermissions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginated list of explicit user permissions. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The user doesn\&#39;t have admin access to the project. |  -  |
|**404** | One or both of the workspace and project don\&#39;t exist for the given identifiers or the requesting user is not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdDelete**
> workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdDelete()

Deletes the project user permission between the requested project and user, if one exists.  Only users with admin permission for the project may access this resource.  Due to security concerns, the JWT and OAuth authentication methods are unsupported. This is to ensure integrations and add-ons are not allowed to change permissions.

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let selectedUserId: string; //This can either be the username, the user\'s UUID surrounded by curly-braces, for example: {account UUID}, or the user\'s Atlassian ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdDelete(
    projectKey,
    selectedUserId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **selectedUserId** | [**string**] | This can either be the username, the user\&#39;s UUID surrounded by curly-braces, for example: {account UUID}, or the user\&#39;s Atlassian ID.  | defaults to undefined|
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
|**204** | The project user permission was deleted and no content returned. |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the project, or the authentication method was not via app password. |  -  |
|**404** | One or more of the workspace, project, and selected user doesn\&#39;t exist for the given identifiers or the requesting user is not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdGet**
> ProjectUserPermission workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdGet()

Returns the explicit user permission for a given user and project.  Only users with admin permission for the project may access this resource.  Permissions can be:  * `admin` * `create-repo` * `write` * `read` * `none`

### Example

```typescript
import {
    ProjectsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let selectedUserId: string; //This can either be the username, the user\'s UUID surrounded by curly-braces, for example: {account UUID}, or the user\'s Atlassian ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdGet(
    projectKey,
    selectedUserId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **selectedUserId** | [**string**] | This can either be the username, the user\&#39;s UUID surrounded by curly-braces, for example: {account UUID}, or the user\&#39;s Atlassian ID.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ProjectUserPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Explicit user permission for user and project |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the project. |  -  |
|**404** | One or more of the workspace, project, and selected user doesn\&#39;t exist for the given identifiers or the requesting user is not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdPut**
> ProjectUserPermission workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdPut(body)

Updates the explicit user permission for a given user and project. The selected user must be a member of the workspace, and cannot be the workspace owner.  Only users with admin permission for the project may access this resource.  Due to security concerns, the JWT and OAuth authentication methods are unsupported. This is to ensure integrations and add-ons are not allowed to change permissions.  Permissions can be:  * `admin` * `create-repo` * `write` * `read`

### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    BitbucketAppsPermissionsSerializersProjectPermissionUpdateSchema
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual key assigned to the project.  (default to undefined)
let selectedUserId: string; //This can either be the username, the user\'s UUID surrounded by curly-braces, for example: {account UUID}, or the user\'s Atlassian ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: BitbucketAppsPermissionsSerializersProjectPermissionUpdateSchema; //The permission to grant

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPermissionsConfigUsersSelectedUserIdPut(
    projectKey,
    selectedUserId,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **BitbucketAppsPermissionsSerializersProjectPermissionUpdateSchema**| The permission to grant | |
| **projectKey** | [**string**] | The project in question. This is the actual key assigned to the project.  | defaults to undefined|
| **selectedUserId** | [**string**] | This can either be the username, the user\&#39;s UUID surrounded by curly-braces, for example: {account UUID}, or the user\&#39;s Atlassian ID.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ProjectUserPermission**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Explicit user permission updated |  -  |
|**400** | No permission value was provided or the value is invalid (not one of read, write, create-repo, or admin) |  -  |
|**401** | The user couldn\&#39;t be authenticated. |  -  |
|**402** | You have reached your plan\&#39;s user limit and must upgrade before giving access to additional users. |  -  |
|**403** | The requesting user isn\&#39;t an admin of the project, or the authentication method was not via app password. |  -  |
|**404** | One or more of the workspace, project, and selected user doesn\&#39;t exist for the given identifiers or the requesting user is not authenticated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyPut**
> Project workspacesWorkspaceProjectsProjectKeyPut(body)

Since this endpoint can be used to both update and to create a project, the request body depends on the intent.  #### Creation  See the POST documentation for the project collection for an example of the request body.  Note: The `key` should not be specified in the body of request (since it is already present in the URL). The `name` is required, everything else is optional.  #### Update  See the POST documentation for the project collection for an example of the request body.  Note: The key is not required in the body (since it is already in the URL). The key may be specified in the body, if the intent is to change the key itself. In such a scenario, the location of the project is changed and is returned in the `Location` header of the response.

### Example

```typescript
import {
    ProjectsApi,
    Configuration,
    Project
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectsApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Project; //

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyPut(
    projectKey,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Project**|  | |
| **projectKey** | [**string**] | The project in question. This is the actual &#x60;key&#x60; assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Project**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The existing project is has been updated. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**201** | A new project has been created. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**403** | The requesting user isn\&#39;t authorized to update or create the project. |  -  |
|**404** | A workspace doesn\&#39;t exist at the location. Note that the project\&#39;s absence from this location doesn\&#39;t raise a 404, since a PUT at a non-existent location can be used to create a new project. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

