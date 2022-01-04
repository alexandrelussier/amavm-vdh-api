namespace AmavmVdhApi.Models;

public class ObservationStoreDatabaseSettings
{
    public string ConnectionString {get; set; } = null!;

    public string DatabaseName {get; set; } = null!;

    public string ObservationCollectionName {get; set;} = null!;

    public string Username {get; set;} = null!;

    public string Password {get; set;} = null!;
}