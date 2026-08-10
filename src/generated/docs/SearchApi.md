# SearchApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**searchAccount**](#searchaccount) | **GET** /users/{selected_user}/search/code | Search for code in a user\&#39;s repositories|
|[**searchTeam**](#searchteam) | **GET** /teams/{username}/search/code | Search for code in a team\&#39;s repositories|
|[**searchWorkspace**](#searchworkspace) | **GET** /workspaces/{workspace}/search/code | Search for code in a workspace|

# **searchAccount**
> SearchResultPage searchAccount()

This API will be deprecated on November 1, 2026.  Search for code in the repositories of the specified user.  Note that searches can match in the file\'s text (`content_matches`), the path (`path_matches`), or both.  You can use the same syntax for the search query as in the UI. E.g. to search for \"foo\" only within the repository \"demo\", use the query parameter `search_query=foo+repo:demo`.  Similar to other APIs, you can request more fields using a `fields` query parameter. E.g. to get some more information about the repository of matched files, use the query parameter `search_query=foo&fields=%2Bvalues.file.commit.repository` (the `%2B` is a URL-encoded `+`). 

### Example

```typescript
import {
    SearchApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SearchApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let searchQuery: string; //The search query (default to undefined)
let page: number; //Which page of the search results to retrieve (optional) (default to 1)
let pagelen: number; //How many search results to retrieve per page (optional) (default to 10)

const { status, data } = await apiInstance.searchAccount(
    selectedUser,
    searchQuery,
    page,
    pagelen
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **searchQuery** | [**string**] | The search query | defaults to undefined|
| **page** | [**number**] | Which page of the search results to retrieve | (optional) defaults to 1|
| **pagelen** | [**number**] | How many search results to retrieve per page | (optional) defaults to 10|


### Return type

**SearchResultPage**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful search |  -  |
|**400** | If the search request was invalid due to one of the following reasons:  * the specified type of target account doesn\&#39;\&#39;t match the actual account type;  * malformed pagination properties;  * missing or malformed search query, in the latter case an error key will be returned in &#x60;error.data.key&#x60; property.  |  -  |
|**404** | Search is not enabled for the requested user, navigate to [https://bitbucket.org/search](https://bitbucket.org/search) to turn it on |  -  |
|**429** | Too many requests, try again later |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchTeam**
> SearchResultPage searchTeam()

This API will be deprecated on November 1, 2026.  Search for code in the repositories of the specified team.  Note that searches can match in the file\'s text (`content_matches`), the path (`path_matches`), or both.  You can use the same syntax for the search query as in the UI. E.g. to search for \"foo\" only within the repository \"demo\", use the query parameter `search_query=foo+repo:demo`.  Similar to other APIs, you can request more fields using a `fields` query parameter. E.g. to get some more information about the repository of matched files, use the query parameter `search_query=foo&fields=%2Bvalues.file.commit.repository` (the `%2B` is a URL-encoded `+`).  Try `fields=%2Bvalues.*.*.*.*` to get an idea what\'s possible. 

### Example

```typescript
import {
    SearchApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SearchApi(configuration);

let username: string; //The account to search in; either the username or the UUID in curly braces (default to undefined)
let searchQuery: string; //The search query (default to undefined)
let page: number; //Which page of the search results to retrieve (optional) (default to 1)
let pagelen: number; //How many search results to retrieve per page (optional) (default to 10)

const { status, data } = await apiInstance.searchTeam(
    username,
    searchQuery,
    page,
    pagelen
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **username** | [**string**] | The account to search in; either the username or the UUID in curly braces | defaults to undefined|
| **searchQuery** | [**string**] | The search query | defaults to undefined|
| **page** | [**number**] | Which page of the search results to retrieve | (optional) defaults to 1|
| **pagelen** | [**number**] | How many search results to retrieve per page | (optional) defaults to 10|


### Return type

**SearchResultPage**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful search |  -  |
|**400** | If the search request was invalid due to one of the following reasons:  * the specified type of target account doesn\&#39;\&#39;t match the actual account type;  * malformed pagination properties;  * missing or malformed search query, in the latter case an error key will be returned in &#x60;error.data.key&#x60; property.  |  -  |
|**404** | Search is not enabled for the requested team, navigate to [https://bitbucket.org/search](https://bitbucket.org/search) to turn it on |  -  |
|**429** | Too many requests, try again later |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchWorkspace**
> SearchResultPage searchWorkspace()

This API will be deprecated on November 1, 2026.  Search for code in the repositories of the specified workspace.  Note that searches can match in the file\'s text (`content_matches`), the path (`path_matches`), or both.  You can use the same syntax for the search query as in the UI. E.g. to search for \"foo\" only within the repository \"demo\", use the query parameter `search_query=foo+repo:demo`.  Similar to other APIs, you can request more fields using a `fields` query parameter. E.g. to get some more information about the repository of matched files, use the query parameter `search_query=foo&fields=%2Bvalues.file.commit.repository` (the `%2B` is a URL-encoded `+`).  Try `fields=%2Bvalues.*.*.*.*` to get an idea what\'s possible. 

### Example

```typescript
import {
    SearchApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SearchApi(configuration);

let workspace: string; //The workspace to search in; either the slug or the UUID in curly braces (default to undefined)
let searchQuery: string; //The search query (default to undefined)
let page: number; //Which page of the search results to retrieve (optional) (default to 1)
let pagelen: number; //How many search results to retrieve per page (optional) (default to 10)

const { status, data } = await apiInstance.searchWorkspace(
    workspace,
    searchQuery,
    page,
    pagelen
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The workspace to search in; either the slug or the UUID in curly braces | defaults to undefined|
| **searchQuery** | [**string**] | The search query | defaults to undefined|
| **page** | [**number**] | Which page of the search results to retrieve | (optional) defaults to 1|
| **pagelen** | [**number**] | How many search results to retrieve per page | (optional) defaults to 10|


### Return type

**SearchResultPage**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful search |  -  |
|**400** | If the search request was invalid due to one of the following reasons:  * the specified type of target account doesn\&#39;\&#39;t match the actual account type;  * malformed pagination properties;  * missing or malformed search query, in the latter case an error key will be returned in &#x60;error.data.key&#x60; property.  |  -  |
|**404** | Search is not enabled for the requested workspace, navigate to [https://bitbucket.org/search](https://bitbucket.org/search) to turn it on |  -  |
|**429** | Too many requests, try again later |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

