# WebhookSubscription


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uuid** | **string** | The webhook\&#39;s id. | [optional] [readonly] [default to undefined]
**url** | **string** | The URL events get delivered to. | [optional] [default to undefined]
**description** | **string** | A user-defined description of the webhook. | [optional] [default to undefined]
**subject_type** | **string** | The type of entity. Set to either &#x60;repository&#x60; or &#x60;workspace&#x60; based on where the subscription is defined. | [optional] [readonly] [default to undefined]
**subject** | **object** |  | [optional] [default to undefined]
**active** | **boolean** | Whether or not the webhook subscription is enabled. | [optional] [default to undefined]
**created_at** | **string** | The timestamp when the webhook subscription was created. | [optional] [readonly] [default to undefined]
**events** | **Array&lt;string&gt;** | The events this webhook is subscribed to. | [optional] [default to undefined]
**secret_set** | **boolean** | Indicates whether or not the hook has an associated secret. It is not possible to see the hook\&#39;s secret. This field is ignored during updates. | [optional] [readonly] [default to undefined]
**secret** | **string** | The secret to associate with the hook. The secret is never returned via the API. As such, this field is only used during updates. The secret can be set to &#x60;null&#x60;&#x60; or &#x60;\&quot;\&quot;&#x60;&#x60; to remove the secret (or create a hook with no secret). Leaving out the secret field during updates will leave the secret unchanged. Leaving out the secret during creation will create a hook with no secret. | [optional] [default to undefined]
**links** | [**WebhooksSubscriptionLinks**](WebhooksSubscriptionLinks.md) |  | [optional] [default to undefined]

## Example

```typescript
import { WebhookSubscription } from './api';

const instance: WebhookSubscription = {
    uuid,
    url,
    description,
    subject_type,
    subject,
    active,
    created_at,
    events,
    secret_set,
    secret,
    links,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
