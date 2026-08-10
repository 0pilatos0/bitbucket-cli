# AddonApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addonAddonKeyClientKeyGet**](#addonaddonkeyclientkeyget) | **GET** /addon/{addon_key}/client-key | Get the client key of a Connect addon|
|[**addonDelete**](#addondelete) | **DELETE** /addon | Delete an app|
|[**addonPut**](#addonput) | **PUT** /addon | Update an installed app|

# **addonAddonKeyClientKeyGet**
> addonAddonKeyClientKeyGet()

Get the client key of the Connect addon associated with a Forge app install via forgeAppId linkage.  This endpoint is part of the Connect -> Forge migration tooling. It is intended to be used by a Forge app using `asApp().requestBitbucket()` only. Prerequisite: app developer needs to register the linkage between their Connect and Forge app by setting `forgeAppId` in the Connect addon descriptor to `app.id` from Forge app manifest, then update the installations. If the request came from an installation of a registered Forge app, the client key of the linked Connect addon installed in the same workspace will be returned.  ``` api.asApp().requestBitbucket(route`/2.0/addon/{addon-key}/client-key`) ```

### Example

```typescript
import {
    AddonApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AddonApi(configuration);

let addonKey: string; //The Connect addon key as defined in an application descriptor.  (default to undefined)

const { status, data } = await apiInstance.addonAddonKeyClientKeyGet(
    addonKey
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **addonKey** | [**string**] | The Connect addon key as defined in an application descriptor.  | defaults to undefined|


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
|**200** | The client key of the Connect addon linked to the Forge app installation where the request was made |  -  |
|**401** | Invalid authentication. |  -  |
|**403** | Improper authorization. |  -  |
|**404** | The Connect addon or the Forge app does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

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

