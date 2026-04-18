# DeploymentsApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createEnvironment**](#createenvironment) | **POST** /repositories/{workspace}/{repo_slug}/environments | Create an environment|
|[**deleteEnvironmentForRepository**](#deleteenvironmentforrepository) | **DELETE** /repositories/{workspace}/{repo_slug}/environments/{environment_uuid} | Delete an environment|
|[**getDeploymentForRepository**](#getdeploymentforrepository) | **GET** /repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid} | Get a deployment|
|[**getDeploymentsForRepository**](#getdeploymentsforrepository) | **GET** /repositories/{workspace}/{repo_slug}/deployments | List deployments|
|[**getEnvironmentForRepository**](#getenvironmentforrepository) | **GET** /repositories/{workspace}/{repo_slug}/environments/{environment_uuid} | Get an environment|
|[**getEnvironmentsForRepository**](#getenvironmentsforrepository) | **GET** /repositories/{workspace}/{repo_slug}/environments | List environments|
|[**repositoriesWorkspaceRepoSlugDeployKeysGet**](#repositoriesworkspacereposlugdeploykeysget) | **GET** /repositories/{workspace}/{repo_slug}/deploy-keys | List repository deploy keys|
|[**repositoriesWorkspaceRepoSlugDeployKeysKeyIdDelete**](#repositoriesworkspacereposlugdeploykeyskeyiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id} | Delete a repository deploy key|
|[**repositoriesWorkspaceRepoSlugDeployKeysKeyIdGet**](#repositoriesworkspacereposlugdeploykeyskeyidget) | **GET** /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id} | Get a repository deploy key|
|[**repositoriesWorkspaceRepoSlugDeployKeysKeyIdPut**](#repositoriesworkspacereposlugdeploykeyskeyidput) | **PUT** /repositories/{workspace}/{repo_slug}/deploy-keys/{key_id} | Update a repository deploy key|
|[**repositoriesWorkspaceRepoSlugDeployKeysPost**](#repositoriesworkspacereposlugdeploykeyspost) | **POST** /repositories/{workspace}/{repo_slug}/deploy-keys | Add a repository deploy key|
|[**updateEnvironmentForRepository**](#updateenvironmentforrepository) | **POST** /repositories/{workspace}/{repo_slug}/environments/{environment_uuid}/changes | Update an environment|
|[**workspacesWorkspaceProjectsProjectKeyDeployKeysGet**](#workspacesworkspaceprojectsprojectkeydeploykeysget) | **GET** /workspaces/{workspace}/projects/{project_key}/deploy-keys | List project deploy keys|
|[**workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdDelete**](#workspacesworkspaceprojectsprojectkeydeploykeyskeyiddelete) | **DELETE** /workspaces/{workspace}/projects/{project_key}/deploy-keys/{key_id} | Delete a deploy key from a project|
|[**workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdGet**](#workspacesworkspaceprojectsprojectkeydeploykeyskeyidget) | **GET** /workspaces/{workspace}/projects/{project_key}/deploy-keys/{key_id} | Get a project deploy key|
|[**workspacesWorkspaceProjectsProjectKeyDeployKeysPost**](#workspacesworkspaceprojectsprojectkeydeploykeyspost) | **POST** /workspaces/{workspace}/projects/{project_key}/deploy-keys | Create a project deploy key|

# **createEnvironment**
> DeploymentEnvironment createEnvironment(deploymentEnvironment)

Create an environment.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration,
    DeploymentEnvironment
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let deploymentEnvironment: DeploymentEnvironment; //The environment to create.

const { status, data } = await apiInstance.createEnvironment(
    workspace,
    repoSlug,
    deploymentEnvironment
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deploymentEnvironment** | **DeploymentEnvironment**| The environment to create. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**DeploymentEnvironment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The environment was created. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The account or repository does not exist. |  -  |
|**409** | An environment host with the provided name already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteEnvironmentForRepository**
> deleteEnvironmentForRepository()

Delete an environment

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment UUID. (default to undefined)

const { status, data } = await apiInstance.deleteEnvironmentForRepository(
    workspace,
    repoSlug,
    environmentUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment UUID. | defaults to undefined|


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
|**204** | The environment was deleted. |  -  |
|**404** | No account or repository with the UUID provided exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getDeploymentForRepository**
> Deployment getDeploymentForRepository()

Retrieve a deployment

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let deploymentUuid: string; //The deployment UUID. (default to undefined)

const { status, data } = await apiInstance.getDeploymentForRepository(
    workspace,
    repoSlug,
    deploymentUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **deploymentUuid** | [**string**] | The deployment UUID. | defaults to undefined|


### Return type

**Deployment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The deployment. |  -  |
|**404** | No account, repository or deployment with the UUID provided exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getDeploymentsForRepository**
> PaginatedDeployments getDeploymentsForRepository()

Find deployments

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getDeploymentsForRepository(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedDeployments**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The matching deployments. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getEnvironmentForRepository**
> DeploymentEnvironment getEnvironmentForRepository()

Retrieve an environment

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment UUID. (default to undefined)

const { status, data } = await apiInstance.getEnvironmentForRepository(
    workspace,
    repoSlug,
    environmentUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment UUID. | defaults to undefined|


### Return type

**DeploymentEnvironment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The environment. |  -  |
|**404** | No account, repository or environment with the UUID provided exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getEnvironmentsForRepository**
> PaginatedEnvironments getEnvironmentsForRepository()

Find environments

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getEnvironmentsForRepository(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedEnvironments**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The matching environments. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDeployKeysGet**
> PaginatedDeployKeys repositoriesWorkspaceRepoSlugDeployKeysGet()

Returns all deploy-keys belonging to a repository.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDeployKeysGet(
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

**PaginatedDeployKeys**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Deploy keys matching the repository |  -  |
|**403** | If the specified user or repository is not accessible to the current user |  -  |
|**404** | If the specified user or repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDeployKeysKeyIdDelete**
> repositoriesWorkspaceRepoSlugDeployKeysKeyIdDelete()

This deletes a deploy key from a repository.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let keyId: string; //The key ID matching the deploy key. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDeployKeysKeyIdDelete(
    keyId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The key ID matching the deploy key. | defaults to undefined|
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
|**204** | The key has been deleted |  -  |
|**403** | If the current user does not have permission to delete a key for the specified user |  -  |
|**404** | If the specified user, repository, or deploy key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDeployKeysKeyIdGet**
> DeployKey repositoriesWorkspaceRepoSlugDeployKeysKeyIdGet()

Returns the deploy key belonging to a specific key.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let keyId: string; //The key ID matching the deploy key. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDeployKeysKeyIdGet(
    keyId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The key ID matching the deploy key. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**DeployKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Deploy key matching the key ID |  -  |
|**403** | If the specified user or repository is not accessible to the current user |  -  |
|**404** | If the specified user or repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDeployKeysKeyIdPut**
> DeployKey repositoriesWorkspaceRepoSlugDeployKeysKeyIdPut()

Create a new deploy key in a repository.  The same key needs to be passed in but the comment and label can change.  Example: ``` $ curl -X PUT \\ -H \"Authorization <auth header>\" \\ -H \"Content-type: application/json\" \\ https://api.bitbucket.org/2.0/repositories/mleu/test/deploy-keys/1234 -d \\ \'{     \"label\": \"newlabel\",     \"key\": \"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDAK/b1cHHDr/TEV1JGQl+WjCwStKG6Bhrv0rFpEsYlyTBm1fzN0VOJJYn4ZOPCPJwqse6fGbXntEs+BbXiptR+++HycVgl65TMR0b5ul5AgwrVdZdT7qjCOCgaSV74/9xlHDK8oqgGnfA7ZoBBU+qpVyaloSjBdJfLtPY/xqj4yHnXKYzrtn/uFc4Kp9Tb7PUg9Io3qohSTGJGVHnsVblq/rToJG7L5xIo0OxK0SJSQ5vuId93ZuFZrCNMXj8JDHZeSEtjJzpRCBEXHxpOPhAcbm4MzULgkFHhAVgp4JbkrT99/wpvZ7r9AdkTg7HGqL3rlaDrEcWfL7Lu6TnhBdq5 newcomment\", }\' ```

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let keyId: string; //The key ID matching the deploy key. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDeployKeysKeyIdPut(
    keyId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The key ID matching the deploy key. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**DeployKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The newly updated deploy key. |  -  |
|**400** | If the submitted key or related value is invalid |  -  |
|**403** | If the current user does not have permission to add a key for the specified user |  -  |
|**404** | If the specified user, repository, or deploy key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDeployKeysPost**
> DeployKey repositoriesWorkspaceRepoSlugDeployKeysPost()

Create a new deploy key in a repository. Note: If authenticating a deploy key with an OAuth consumer, any changes to the OAuth consumer will subsequently invalidate the deploy key.   Example: ``` $ curl -X POST \\ -H \"Authorization <auth header>\" \\ -H \"Content-type: application/json\" \\ https://api.bitbucket.org/2.0/repositories/mleu/test/deploy-keys -d \\ \'{     \"key\": \"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDAK/b1cHHDr/TEV1JGQl+WjCwStKG6Bhrv0rFpEsYlyTBm1fzN0VOJJYn4ZOPCPJwqse6fGbXntEs+BbXiptR+++HycVgl65TMR0b5ul5AgwrVdZdT7qjCOCgaSV74/9xlHDK8oqgGnfA7ZoBBU+qpVyaloSjBdJfLtPY/xqj4yHnXKYzrtn/uFc4Kp9Tb7PUg9Io3qohSTGJGVHnsVblq/rToJG7L5xIo0OxK0SJSQ5vuId93ZuFZrCNMXj8JDHZeSEtjJzpRCBEXHxpOPhAcbm4MzULgkFHhAVgp4JbkrT99/wpvZ7r9AdkTg7HGqL3rlaDrEcWfL7Lu6TnhBdq5 mleu@C02W454JHTD8\",     \"label\": \"mydeploykey\" }\' ```

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDeployKeysPost(
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

**DeployKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The deploy key that was created |  -  |
|**400** | Invalid deploy key inputs |  -  |
|**403** | If the specified user or repository is not accessible to the current user |  -  |
|**404** | If the specified user or repository does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateEnvironmentForRepository**
> updateEnvironmentForRepository()

Update an environment

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment UUID. (default to undefined)

const { status, data } = await apiInstance.updateEnvironmentForRepository(
    workspace,
    repoSlug,
    environmentUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment UUID. | defaults to undefined|


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
|**202** | The environment update request was accepted. |  -  |
|**404** | No account, repository or environment with the UUID provided exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDeployKeysGet**
> PaginatedProjectDeployKeys workspacesWorkspaceProjectsProjectKeyDeployKeysGet()

Returns all deploy keys belonging to a project.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDeployKeysGet(
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

**PaginatedProjectDeployKeys**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Deploy keys matching the project |  -  |
|**403** | If the specified workspace or project is not accessible to the current user |  -  |
|**404** | If the specified workspace or project does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdDelete**
> workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdDelete()

This deletes a deploy key from a project.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let keyId: string; //The key ID matching the project deploy key. (default to undefined)
let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdDelete(
    keyId,
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The key ID matching the project deploy key. | defaults to undefined|
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
|**204** | The project deploy key has been deleted |  -  |
|**403** | If the current user does not have permission to delete a key for the specified project |  -  |
|**404** | If the specified workspace, project, or project deploy key does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdGet**
> ProjectDeployKey workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdGet()

Returns the deploy key belonging to a specific key ID.

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let keyId: string; //The key ID matching the project deploy key. (default to undefined)
let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDeployKeysKeyIdGet(
    keyId,
    projectKey,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyId** | [**string**] | The key ID matching the project deploy key. | defaults to undefined|
| **projectKey** | [**string**] | The project in question. This is the actual &#x60;key&#x60; assigned to the project.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ProjectDeployKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Project deploy key matching the key ID |  -  |
|**403** | If the specified workspace or project is not accessible to the current user |  -  |
|**404** | If the specified workspace or project does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspaceProjectsProjectKeyDeployKeysPost**
> ProjectDeployKey workspacesWorkspaceProjectsProjectKeyDeployKeysPost()

Create a new deploy key in a project.  Example: ``` $ curl -X POST \\ -H \"Authorization <auth header>\" \\ -H \"Content-type: application/json\" \\ https://api.bitbucket.org/2.0/workspaces/standard/projects/TEST_PROJECT/deploy-keys/ -d \\ \'{     \"key\": \"ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDAK/b1cHHDr/TEV1JGQl+WjCwStKG6Bhrv0rFpEsYlyTBm1fzN0VOJJYn4ZOPCPJwqse6fGbXntEs+BbXiptR+++HycVgl65TMR0b5ul5AgwrVdZdT7qjCOCgaSV74/9xlHDK8oqgGnfA7ZoBBU+qpVyaloSjBdJfLtPY/xqj4yHnXKYzrtn/uFc4Kp9Tb7PUg9Io3qohSTGJGVHnsVblq/rToJG7L5xIo0OxK0SJSQ5vuId93ZuFZrCNMXj8JDHZeSEtjJzpRCBEXHxpOPhAcbm4MzULgkFHhAVgp4JbkrT99/wpvZ7r9AdkTg7HGqL3rlaDrEcWfL7Lu6TnhBdq5 mleu@C02W454JHTD8\",     \"label\": \"mydeploykey\" }\' ```

### Example

```typescript
import {
    DeploymentsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DeploymentsApi(configuration);

let projectKey: string; //The project in question. This is the actual `key` assigned to the project.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspaceProjectsProjectKeyDeployKeysPost(
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

**ProjectDeployKey**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The project deploy key that was created |  -  |
|**400** | Invalid deploy key inputs |  -  |
|**403** | If the specified workspace or project is not accessible to the current user |  -  |
|**404** | If the specified workspace or project does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

