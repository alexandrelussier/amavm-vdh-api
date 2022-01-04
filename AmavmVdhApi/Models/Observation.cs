using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;
using System.ComponentModel;

namespace AmavmVdhApi.Models;
public enum ObservationStatus
{
  Pending,
  Rejected,
  Valid,
}

public enum AssetContentType
{
  [Description("image/jpeg")]
  ImageJpeg,

  [Description("image/png")]
  ImagePng,
}

public class ReportedObservation
{
  [BsonId]
  [BsonRepresentation(BsonType.ObjectId)]
  public string? Id { get; set; }

  [BsonElement("status")]
  [JsonPropertyName("status")]
  public ObservationStatus Status { get; set; }

  public ObservationRequest Observation { get; set; } = null!;
}

public class ObservationRequest
{
  [BsonElement("assets")]
  [JsonPropertyName("assets")]
  public ObservationRequestAsset[]? Assets { get; set; } = null!;

  [BsonElement("attributes")]
  [JsonPropertyName("attributes")]
  public string[]? Attributes { get; set; } = null!;

  [BsonElement("comment")]
  [JsonPropertyName("comment")]
  public string? Comment { get; set; } = null!;

  [BsonElement("deviceId")]
  [JsonPropertyName("deviceId")]
  public string DeviceId { get; set; } = null!;

  [BsonElement("position")]
  [JsonPropertyName("position")]
  public double[] Position { get; set; } = null!;

  [BsonElement("timestamp")]
  [JsonPropertyName("timestamp")]
  public DateTimeOffset Timestamp { get; set; }
}

public class ObservationRequestAsset
{
  [BsonElement("contentType")]
  [JsonPropertyName("contentType")]
  public AssetContentType ContentType { get; set; }

  [BsonElement("data")]
  [JsonPropertyName("data")]
  public byte[] Data { get; set; } = null!;
}
