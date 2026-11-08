# Test account labels

The existing authenticated Personal session carries the backend's additive
`test_data` flag. Account controls display a FR/EN/LN/SW test-account label and
clear it with the normal session/sign-out lifecycle. No number or designation is
stored in the browser. The label grants no permissions and does not classify
anonymous public content as test data.

Backend provenance and protected preview policies enforce isolation. The public
client already bypasses caching for identity-bearing data; only identity-free
catalog metadata is cacheable. Deploy this companion with SHIDA Admin's matching
backend 0229 release.
