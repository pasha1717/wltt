import json,urllib.request,ssl,os
c=ssl.create_default_context(cafile=os.environ['SSL_CERT_FILE'])
d=json.load(urllib.request.urlopen(urllib.request.Request('https://api.elevenlabs.io/v1/user/subscription',headers={'xi-api-key':'proxy-injected'}),context=c))
print(d['character_limit']-d['character_count'])
