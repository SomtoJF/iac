import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import path = require("path");
import { readdirSync } from "fs";

// config
const config = new pulumi.Config();
const siteDir = config.require("site-dir");

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket", {
	website: { indexDocument: "index.html" },
});

const ownershipControls = new aws.s3.BucketOwnershipControls(
	"ownership-controls",
	{
		bucket: bucket.id,
		rule: {
			objectOwnership: "ObjectWriter",
		},
	}
);

const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
	"public-access-block",
	{
		bucket: bucket.id,
		blockPublicAcls: false,
	}
);

const codeBase = readdirSync(siteDir);

codeBase.forEach((file) => {
	const filename = path.join(siteDir, file);
	const object = new aws.s3.BucketObject(
		file,
		{
			bucket: bucket.id,
			source: new pulumi.asset.FileAsset(filename),
			contentType: "text/html",
			acl: "public-read",
		},
		{ dependsOn: [publicAccessBlock, ownershipControls] }
	);
});

// Export the name of the bucket
export const bucketName = bucket.id;
export const bucketEndpoint = pulumi.interpolate`http://${bucket.websiteEndpoint}`;
