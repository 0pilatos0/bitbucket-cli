# AddonApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addonDelete**](#addondelete) | **DELETE** /addon | Delete an app|
|[**addonLinkersGet**](#addonlinkersget) | **GET** /addon/linkers | List linkers for an app|
|[**addonLinkersLinkerKeyGet**](#addonlinkerslinkerkeyget) | **GET** /addon/linkers/{linker_key} | Get a linker for an app|
|[**addonLinkersLinkerKeyValuesDelete**](#addonlinkerslinkerkeyvaluesdelete) | **DELETE** /addon/linkers/{linker_key}/values | Delete all linker values|
|[**addonLinkersLinkerKeyValuesGet**](#addonlinkerslinkerkeyvaluesget) | **GET** /addon/linkers/{linker_key}/values | List linker values for a linker|
|[**addonLinkersLinkerKeyValuesPost**](#addonlinkerslinkerkeyvaluespost) | **POST** /addon/linkers/{linker_key}/values | Create a linker value|
|[**addonLinkersLinkerKeyValuesPut**](#addonlinkerslinkerkeyvaluesput) | **PUT** /addon/linkers/{linker_key}/values | Update a linker value|
|[**addonLinkersLinkerKeyValuesValueIdDelete**](#addonlinkerslinkerkeyvaluesvalueiddelete) | **DELETE** /addon/linkers/{linker_key}/values/{value_id} | Delete a linker value|
|[**addonLinkersLinkerKeyValuesValueIdGet**](#addonlinkerslinkerkeyvaluesvalueidget) | **GET** /addon/linkers/{linker_key}/values/{value_id} | Get a linker value|
|[**addonPut**](#addonput) | **PUT** /addon | Update an installed app|

# **addonDelete**
> addonDelete()

Deletes the application for the user.  This endpoint is intended to be used by Bitbucket Connect apps and only supports JWT authentication -- that is how Bitbucket identifies the particular installation of the app. Developers with applications registered in the \"Develop Apps\" section of Bitbucket Marketplace need not use this endpoint as updates for those applications can be sent out via the UI of that section.  ``` $ curl -X DELETE https://api.bitbucket.org/2.0/addon \\   -H \"Authorization: JWT <JWT Token>\" ```

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

const { status, data } = await apiInstance.addonDelete();
```

### Parameters
This endpoint does not have any parameters.


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
|**204** | Request has succeeded. The application has been deleted for the user. |  -  |
|**401** | No authorization. |  -  |
|**403** | Improper authentication. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersGet**
> addonLinkersGet()

Gets a list of all [linkers](/cloud/bitbucket/modules/linker/) for the authenticated application.  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

const { status, data } = await apiInstance.addonLinkersGet();
```

### Parameters
This endpoint does not have any parameters.


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
|**200** | Successful. |  -  |
|**401** | Authentication must use app JWT |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyGet**
> addonLinkersLinkerKeyGet()

Gets a [linker](/cloud/bitbucket/modules/linker/) specified by `linker_key` for the authenticated application.  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyGet(
    linkerKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|


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
|**200** | Successful. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyValuesDelete**
> addonLinkersLinkerKeyValuesDelete()

Delete all [linker](/cloud/bitbucket/modules/linker/) values for the specified linker of the authenticated application.  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyValuesDelete(
    linkerKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|


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
|**204** | Successfully deleted the linker values. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyValuesGet**
> addonLinkersLinkerKeyValuesGet()

Gets a list of all [linker](/cloud/bitbucket/modules/linker/) values for the specified linker of the authenticated application.  A linker value lets applications supply values to modify its regular expression.  The base regular expression must use a Bitbucket-specific match group `(?K)` which will be translated to `([\\w\\-]+)`. A value must match this pattern.  [Read more about linker values](/cloud/bitbucket/modules/linker/#usingthebitbucketapitosupplyvalues)  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyValuesGet(
    linkerKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|


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
|**200** | Successful. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyValuesPost**
> addonLinkersLinkerKeyValuesPost()

Creates a [linker](/cloud/bitbucket/modules/linker/) value for the specified linker of authenticated application.  A linker value lets applications supply values to modify its regular expression.  The base regular expression must use a Bitbucket-specific match group `(?K)` which will be translated to `([\\w\\-]+)`. A value must match this pattern.  [Read more about linker values](/cloud/bitbucket/modules/linker/#usingthebitbucketapitosupplyvalues)  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyValuesPost(
    linkerKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|


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
|**201** | Successfully created the linker value. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker does not exist. |  -  |
|**409** | The linker already has the value being added. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyValuesPut**
> addonLinkersLinkerKeyValuesPut()

Bulk update [linker](/cloud/bitbucket/modules/linker/) values for the specified linker of the authenticated application.  A linker value lets applications supply values to modify its regular expression.  The base regular expression must use a Bitbucket-specific match group `(?K)` which will be translated to `([\\w\\-]+)`. A value must match this pattern.  [Read more about linker values](/cloud/bitbucket/modules/linker/#usingthebitbucketapitosupplyvalues)  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyValuesPut(
    linkerKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|


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
|**204** | Successfully updated the linker values. |  -  |
|**400** | Invalid input. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyValuesValueIdDelete**
> addonLinkersLinkerKeyValuesValueIdDelete()

Delete a single [linker](/cloud/bitbucket/modules/linker/) value of the authenticated application.  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)
let valueId: number; //The numeric ID of the linker value. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyValuesValueIdDelete(
    linkerKey,
    valueId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|
| **valueId** | [**number**] | The numeric ID of the linker value. | defaults to undefined|


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
|**204** | Successfully deleted the linker value. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker value does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonLinkersLinkerKeyValuesValueIdGet**
> addonLinkersLinkerKeyValuesValueIdGet()

Get a single [linker](/cloud/bitbucket/modules/linker/) value of the authenticated application.  This endpoint is deprecated and will be removed by May 2026.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let linkerKey: string; //The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. (default to undefined)
let valueId: number; //The numeric ID of the linker value. (default to undefined)

const { status, data } = await apiInstance.addonLinkersLinkerKeyValuesValueIdGet(
    linkerKey,
    valueId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **linkerKey** | [**string**] | The unique key of a [linker module](/cloud/bitbucket/modules/linker/) as defined in an application descriptor. | defaults to undefined|
| **valueId** | [**number**] | The numeric ID of the linker value. | defaults to undefined|


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
|**200** | Successful. |  -  |
|**401** | Authentication must use app JWT |  -  |
|**404** | The linker value does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **addonPut**
> addonPut()

Updates the application installation for the user.  This endpoint is intended to be used by Bitbucket Connect apps and only supports JWT authentication -- that is how Bitbucket identifies the particular installation of the app. Developers with applications registered in the \"Develop Apps\" section of Bitbucket need not use this endpoint as updates for those applications can be sent out via the UI of that section.  Passing an empty body will update the installation using the existing descriptor URL.  ``` $ curl -X PUT https://api.bitbucket.org/2.0/addon \\   -H \"Authorization: JWT <JWT Token>\" \\   --header \"Content-Type: application/json\" \\   --data \'{}\' ```  The new `descriptor` for the installation can be also provided in the body directly.  ``` $ curl -X PUT https://api.bitbucket.org/2.0/addon \\   -H \"Authorization: JWT <JWT Token>\" \\   --header \"Content-Type: application/json\" \\   --data \'{\"descriptor\": $NEW_DESCRIPTOR}\' ```  In both these modes the URL of the descriptor cannot be changed. To change the descriptor location and upgrade an installation the request must be made exclusively with a `descriptor_url`.   ``` $ curl -X PUT https://api.bitbucket.org/2.0/addon \\   -H \"Authorization: JWT <JWT Token>\" \\   --header \"Content-Type: application/json\" \\   --data \'{\"descriptor_url\": $NEW_URL}\' ```  The `descriptor_url` must exactly match the marketplace registration that Atlassian has for the application. Contact your Atlassian developer advocate to update this registration. Once the registration has been updated you may call this resource for each installation.  Note that the scopes of the application cannot be increased in the new descriptor nor reduced to none.

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

const { status, data } = await apiInstance.addonPut();
```

### Parameters
This endpoint does not have any parameters.


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
|**204** | Request has succeeded. The installation has been updated to the new descriptor. |  -  |
|**400** | Scopes have increased or decreased to none. |  -  |
|**401** | No authorization. |  -  |
|**403** | Improper authentication. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

