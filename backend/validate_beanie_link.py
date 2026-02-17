import asyncio
from beanie import Document, Link, init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from bson import ObjectId, DBRef
from typing import Optional

class Target(Document):
    name: str
    class Settings:
        name = "targets"

class Source(Document):
    target: Link[Target]
    class Settings:
        name = "sources"

async def test_link():
    try:
        # We don't need a real DB for initialization check, but beanie needs one to init models
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        # Just init enough to check constructor behavior
        # await init_beanie(database=client.test_db, document_models=[Target, Source])
        
        target_id = ObjectId()
        
        print("Testing direct Link initialization with id (old method)...")
        try:
            # This is what's in the code and is suspected to fail
            # s = Source(target=Link(id=target_id, document_class=Target))
            print("Link(id=...) check skipped (we know it fails)")
        except Exception as e:
            print(f"Failed as expected: {e}")

        print("\nTesting Link(ref=DBRef(...))...")
        try:
            from bson import DBRef
            ref = DBRef(collection="targets", id=target_id)
            # In Beanie, Link(ref=ref) is a common pattern
            l = Link(ref=ref)
            print(f"Successfully created Link: {l}")
            s = Source(target=l)
            print(f"Successfully created Source with Link: {s}")
        except Exception as e:
            print(f"Failed Link(ref=...): {e}")

        print("\nTesting Document.link_from_id()...")
        try:
            # Check if link_from_id exists
            if hasattr(Target, "link_from_id"):
                l = Target.link_from_id(target_id)
                print(f"Successfully created Link via link_from_id: {l}")
            else:
                print("Target.link_from_id does not exist")
        except Exception as e:
            print(f"Failed link_from_id: {e}")

        print("\nTesting direct ObjectId assignment...")
        try:
            # Many versions of Beanie allow this
            s = Source(target=target_id) # type: ignore
            print(f"Successfully created Source with direct ObjectId: {s}")
        except Exception as e:
            print(f"Failed direct ObjectId: {e}")

    except Exception as e:
        print(f"Generic error: {e}")

if __name__ == "__main__":
    # Just run the logic outside of event loop if we don't need real init
    # but some Beanie parts might need it.
    
    # Let's try to just check the Link class signature without full init
    target_id = ObjectId()
    print("Link signature check:")
    import inspect
    print(f"Link constructor: {inspect.signature(Link.__init__)}")
    
    # Try initialization
    try:
        from bson import DBRef
        l = Link(ref=DBRef(collection="targets", id=target_id))
        print("Link(ref=DBRef(...)) works!")
    except Exception as e:
        print(f"Link(ref=DBRef(...)) fails: {e}")

